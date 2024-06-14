import { NextRequest, NextResponse } from 'next/server';
import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { init, fetchQuery } from '@airstack/airstack-react';
import { URLSearchParams } from 'url';

const apiKey = process.env.AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("Missing AIRSTACK_API_KEY environment variable");
}
init(apiKey);

let variables;

async function getResponse(req: NextRequest): Promise<NextResponse> {

  const body: FrameRequest = await req.json();

  const hashParams = req.nextUrl.searchParams
  const replyHash = hashParams.get('hash')
  const replyHashh = replyHash ? replyHash : 1
  console.log(replyHashh);
  
  const { untrustedData } = body

  const isValidEmail = untrustedData.inputText.match(
    /^https:\/\/warpcast\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/
  )

  if (!untrustedData.inputText || !isValidEmail) {
    const searchParams = new URLSearchParams({
      title: 'Valid Cast Link Required',
    })

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Try Again',
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`,
        },
        input: {
          text: 'Cast Link',
        },
        postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced`,
      })
    )
  }

  const castLink = untrustedData.inputText;
  const castHashQuery = `
  query GetCastHashFromUrl($blockchain: EveryBlockchain!, $url: String) {
    FarcasterCasts(input: {blockchain: $blockchain, filter: {url: {_eq: $url}}}) {
      Cast {
        hash,
        fid,
        text
      }
    }
  }
`;

variables = {
    blockchain: 'ALL',
    url: castLink
  };

  async function getCastHash(castHashQuery: string, variables: any) {

    let parsed_fid;
    let hash;
    let Casttext;

    let { data, error } = await fetchQuery(castHashQuery, variables);
    if (data) {
      console.log(data.FarcasterCasts.Cast);
      parsed_fid = `fc_fid:${data.FarcasterCasts.Cast[0].fid}`
      hash = data.FarcasterCasts.Cast[0].hash
      Casttext = data.FarcasterCasts.Cast[0].text
    }

    if (error) {
      console.log(error);
    }
    console.log(untrustedData.inputText)
    
    return {parsed_fid, hash, Casttext}
  }

  const {parsed_fid, hash, Casttext} = await getCastHash(castHashQuery, variables)

  const CastParams = new URLSearchParams({
    description: Casttext
  });

  console.log(parsed_fid)
  console.log(hash)
  console.log(Casttext)

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        {
          label: 'back',
          action: 'post',
          target: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced?hash=${hash}`,
        },
        {
          label: 'next',
          action: 'post',
          target: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced`,
        },
      ],
      image: {
        src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${CastParams}`,
      },
    })
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';


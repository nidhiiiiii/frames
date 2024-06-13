import { NextRequest, NextResponse } from 'next/server';
import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { init, fetchQuery } from '@airstack/airstack-react';
import { URLSearchParams } from 'url';

init("105ae4794a7fb4d289523b341c4f90c38");

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const hashParams = req.nextUrl.searchParams;
  const hashh = hashParams.get('hash');
  // console.log(`The request being obtained is:`, req);
  const body: FrameRequest = await req.json();                                            // 'req' is the incoming request from the client. It is parsed here into a FrameRequest object.
  // const urlParams = new URL(req.nextUrl);                                                     // Create a URL object from the request URL
  // const hashParams = new URLSearchParams(urlParams.search);                                               // Extract query parameters from the URL
  // const hashh = hashParams.get(`hash`);                                                  // Get the value of the 'hash' parameter
  console.log(`The URL being obtained is:` + hashh);                                     // Log the 'hash' value
  // console.log(`The URL being obtained is: ${req.nextUrl}`);

  const { untrustedData } = body;

  const isValidEmail = untrustedData.inputText.match(
    /^https:\/\/warpcast\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/
  );

  if (!untrustedData.inputText || !isValidEmail) {
    const searchParams = new URLSearchParams({
      title: 'Valid Cast Link Required',
    });

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
    );
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

  const variables = {
    blockchain: 'ALL',
    url: castLink,
  };

  async function getCastHash(castHashQuery: string, variables: any) {
    let parsed_fid;
    let hash;
    let Casttext;
    let { data, error } = await fetchQuery(castHashQuery, variables);
    if (data) {
      console.log(data.FarcasterCasts.Cast);
      parsed_fid = `fc_fid:${data.FarcasterCasts.Cast[0].fid}`;
      hash = data.FarcasterCasts.Cast[0].hash;
      Casttext = data.FarcasterCasts.Cast[0].text;
    }

    if (error) {
      console.log(error);
    }
    console.log(untrustedData.inputText);
    return { parsed_fid, hash, Casttext };
  }

  const { parsed_fid, hash, Casttext } = await getCastHash(castHashQuery, variables);

  const CastParams = new URLSearchParams({
    description: Casttext,
  });

  console.log(parsed_fid);
  console.log(hash);
  console.log(Casttext);

  const getReplyQuery = `
    query FetchRepliesByUserAndCastHash($_fid: Identity, $_hash: String, $blockchain: EveryBlockchain!, $limit: Int) {
      FarcasterReplies(input: {filter: {repliedBy: {_eq: $_fid}, parentHash: {_eq: $_hash}}, blockchain: $blockchain, limit: $limit})
       {
         Reply {
           hash
           text
         }
       }
    }
  `;

  const variables2 = {
    _fid: parsed_fid,
    _hash: hash,
    blockchain: 'ALL',
    limit: 10,
  };

  async function getSingleReply(getReplyQuery: string, variables2: any) {
    let { data, error } = await fetchQuery(getReplyQuery, variables2);
    if (data && data.FarcasterReplies && data.FarcasterReplies.Reply && data.FarcasterReplies.Reply.length > 0) {
      // Return the first reply
      return data.FarcasterReplies.Reply[0];
    } else {
      return 0;
    }
  }

  const reply = await getSingleReply(getReplyQuery, variables2);
  // console.log(reply+`this is reply`);

  const searchParams = new URLSearchParams({
    // title: 'Valid Cast Check Successful',
    description: reply.text,
  });

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
          target: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced?hash=${reply.hash}`,
        },
      ],
      image: {
        src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${CastParams}`,
      },
    })
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';



// const hashParams = req.nextUrl.searchParams
// const replyHash = hashParams.get('hash')
// const replyHashh = replyHash ? replyHash : 1

/**
 * This function, getResponse, is an asynchronous function that takes a request object (req) as an argument and returns a response object (NextResponse).
 * 
 * In technical terms:
 * - It first parses the request body as a FrameRequest object.
 * - It then extracts URL parameters from the request's URL.
 * - Specifically, it looks for a parameter named 'hash' in the URL's query string.
 * - It logs the value of the 'hash' parameter and the full URL to the console.

 */
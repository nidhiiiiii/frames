import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame'
import { NextRequest, NextResponse } from 'next/server'
import { init, fetchQuery} from '@airstack/airstack-react'

init("105ae4794a7fb4d289523b341c4f90c38")


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

  const variables = {
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

  const getReplyQuery = `query FetchRepliesByUserAndCastHash($_fid: Identity, $_hash: String, $blockchain: EveryBlockchain!, $limit: Int) {
    FarcasterReplies(input: {filter: {repliedBy: {_eq: $_fid}, parentHash: {_eq: $_hash}}, blockchain: $blockchain, limit: $limit})
     {
      Reply {
        hash
        text
      }
    }
  }`;
  
  const variables2 = {
    _fid: parsed_fid,
    _hash: hash, 
    blockchain: 'ALL', 
    limit: 10 
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
  console.log(reply);

  const searchParams = new URLSearchParams({
    // title: 'Valid Cast Check Successful',
    description: reply.text,
  })


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

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req)
}

export const dynamic = 'force-dynamic'


  // async function getReplies(getReplyQuery: string, variables: any) {
  //   let moreReplies = true;
  //   while (moreReplies) {
  //     let { data, error } = await fetchQuery(getReplyQuery, variables);
  //     if (data) {
  //       console.log(data.FarcasterReplies);
  //       // If there are more replies, update the _hash variable
  //       if (data.FarcasterReplies.length > 0) {
  //         variables._hash = data.FarcasterReplies[data.FarcasterReplies.length - 1].hash;
  //       } else {
  //         moreReplies = false;
  //       }
  //     } else {
  //       moreReplies = false;
  //     }
  //   }
  // }
    // const castHashResult = await getCastHash(castHashQuery, variables);
  // const variables2 = {
  //   fid: castHashResult.parsed_fid,
  //   hash: castHashResult.hash, 
  //   blockchain: 'ALL', 
  //   limit: 10 
  // };

  // const getReplyQuery = `query FetchRepliesByUserAndCastHash($_fid: Identity, $_hash: String, $blockchain: EveryBlockchain!, $limit: Int) {
  //   FarcasterReplies(
  //     input: {filter: {repliedBy: {_eq: $_fid}, parentHash: {_eq: $_hash}}, blockchain: $blockchain, limit: $limit}
  //   ) {
  //     Reply {
  //       hash
  //       castedAtTimestamp
  //       text
  //       numberOfLikes
  //       numberOfRecasts
  //     }
  //   }
  // }`;
  // async function getReplies(getReplyQuery: string, variables: any) {
  //   let { data, error } = await fetchQuery(getReplyQuery, variables);
  //   let allReplies = [];
  //   let moreReplies = true;
  //   if (data) {
  //     console.log(data.FarcasterReplies.Reply);
  //     // If there are more replies, fetch them recursively
  //     if (data.FarcasterReplies.Reply.length > 0) {
  //       // Update the variables with the hash of the last reply
  //       variables._hash = data.FarcasterReplies[data.FarcasterReplies.length - 1].hash;
  //       // Call the function recursively
  //       await getReplies(getReplyQuery, variables);
  //     }
  //   }
  //   if (error) {
  //     console.log(error);
  //   }
  //   return data.FarcasterReplies;
  // }
  
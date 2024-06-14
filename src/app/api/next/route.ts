import { NextRequest, NextResponse } from 'next/server';
import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { init, fetchQuery } from '@airstack/airstack-react';
import { URLSearchParams } from 'url';

const apiKey = process.env.AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("Missing AIRSTACK_API_KEY environment variable");
}
init(apiKey);


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
      
  import { castHashQuery, variables } from '../advanced/route';
  const { _fid, _hash } = await getCastHash(castHashQuery, variables);
  
  const variables2 = {
    _fid: _fid,
    _hash: _hash,
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


function getCastHash(castHashQuery: any, variables: any): { _fid: any; _hash: any; } | PromiseLike<{ _fid: any; _hash: any; }> {
    throw new Error('Function not implemented.');
}
// import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame'
// import { NextRequest, NextResponse } from 'next/server'

// async function getResponse(req: NextRequest): Promise<NextResponse> {
//   const body: FrameRequest = await req.json()

//   const { untrustedData } = body

//   const isValidURL = untrustedData.inputText.match(
//     /^https:\/\/warpcast\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/
//   )

//   if (!untrustedData.inputText || !isValidURL) {
//     const searchParams = new URLSearchParams({
//       title: 'Valid Email Required',
//     })
//     return new NextResponse(
//       getFrameHtmlResponse({
//         buttons: [
//           {
//             label: 'Try Again',
//           },
//         ],
//         image: {
//           src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`,
//         },
//         input: {
//           text: 'Your Email',
//         },
//         postUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/url`,
//       })
//     )
//   }

//   const searchParams = new URLSearchParams({
//     title: 'Signup Successful',
//     description: untrustedData.inputText,
//   })

//   return new NextResponse(
//     getFrameHtmlResponse({
//       image: {
//         src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${searchParams}`,
//       },
//     })
//   )
// }

// export async function POST(req: NextRequest): Promise<Response> {
//   return getResponse(req)
// }

// export const dynamic = 'force-dynamic'

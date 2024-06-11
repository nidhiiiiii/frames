import { FrameRequest, getFrameHtmlResponse } from '@coinbase/onchainkit/frame'
import { NextRequest, NextResponse } from 'next/server'
import { init, fetchQuery} from '@airstack/airstack-react'

export async function POST(req: NextRequest): Promise<Response> {
    // Determine which button was clicked based on the request URL
    const buttonClicked = req.nextUrl.pathname.split('/').pop();
  
    let CastParams;
  
    if (buttonClicked === 'button1') {
      // Set CastParams for Button 1
      CastParams = new URLSearchParams({
        description: 'Button 1 Casttext'
      });
    } else if (buttonClicked === 'button2') {
      // Set CastParams for Button 2
      CastParams = new URLSearchParams({
        description: 'Button 2 Casttext'
      });
    }
  
    // Rest of your code...
  
    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Button 1',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced/button1`,
          },
          {
            label: 'Button 2',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_SITE_URL}/api/advanced/button2`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_SITE_URL}/og?${CastParams}`,
        },
      })
    )
  }
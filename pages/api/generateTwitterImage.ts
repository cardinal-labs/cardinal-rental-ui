import * as canvas from 'canvas'
import type { NextApiRequest, NextApiResponse } from 'next'

const generateTwitterImage = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // setup
  // overlay text
  const WIDTH = 1200
  const HEIGHT = 675
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT)

  const nftImageUri = req.query.nftImageUri as string
  const claimed = (req.query.claimed as string) === 'true'

  // draw base image
  const baseImgUri = claimed
    ? 'https://rent-v2.cardinal.so/assets/twitter-claimed.png'
    : 'https://rent-v2.cardinal.so/assets/twitter-rented.png'

  const backgroundCtx = imageCanvas.getContext('2d')
  backgroundCtx.fillStyle = 'rgba(26, 27, 32, 1)'
  backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT)

  function drawRoundedImage(
    ctx: canvas.CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const img = await canvas.loadImage(baseImgUri)
  const imgContext = imageCanvas.getContext('2d')
  if (img.height > img.width) {
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
  } else {
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
  }

  const nftWidth = claimed ? 385 : 450
  const nftHeight = claimed ? 385 : 450
  const xDiff = claimed ? 407 : 577
  const yDiff = claimed ? 177 : 112

  const nftImage = await canvas.loadImage(nftImageUri)
  drawRoundedImage(backgroundCtx, xDiff, yDiff, nftWidth, nftHeight, 18)
  backgroundCtx.clip()
  backgroundCtx.drawImage(nftImage, xDiff, yDiff, nftWidth, nftHeight)
  backgroundCtx.closePath()

  const buffer = imageCanvas.toBuffer('image/png')
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffer.length,
  })
  res.end(buffer, 'binary')
}

export default generateTwitterImage

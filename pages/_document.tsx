import Document, { Head, Html, Main, NextScript } from 'next/document'

class AppDocument extends Document {
  override render() {
    return (
      <Html>
        <Head>
          <title>Cardinal</title>
          <link rel="icon" href="/favicon.ico" />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Lato:wght@100&display=swap"
            rel="stylesheet"
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Kanit:ital@0;1&family=Oswald:wght@200;300;400;500&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Karla:wght@600&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className="bg-dark-5">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default AppDocument

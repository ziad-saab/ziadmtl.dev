import { NextPage } from 'next';
import Script from 'next/script';
import { useEffect } from 'react';
import { Layout } from '~/components/layout';

declare global {
  namespace AdobeDC {
    class View {
      constructor(...args: any);
      previewFile(...args: any): void;
    }
  }
}

const DIV_ID = 'ziad-saab-cv';
const Cv: NextPage = () => {
  useEffect(() => {
    const adobeDcViewSdkReady = () => {
      const adobeDCView = new AdobeDC.View({
        clientId: location.hostname === 'localhost' ? 'd0829e5c4c944481ae79d36bad0b93bf' : '670f52a713724d1c9240c173afe83b64',
        divId: DIV_ID,
      });

      adobeDCView.previewFile({
        content: {
          location: {
            url: '/documents/ziad-saab-cv.pdf',
          },
        },
        metaData: {
          fileName: 'ziad-saab-cv.pdf',
        },
      }, { embedMode: 'IN_LINE' });
    };

    if (typeof window.AdobeDC?.View === 'undefined') {
      document.addEventListener('adobe_dc_view_sdk.ready', adobeDcViewSdkReady);
    } else {
      adobeDcViewSdkReady();
    }
    
    return () => document.removeEventListener('adobe_dc_view_sdk.ready', adobeDcViewSdkReady);
  }, []);

  return (
    <Layout
      meta={{
        title: "Ziad Saab's CV - FullStack Consultant",
        description: "Fullstack Consultant Ziad Saab's résumé in PDF format",
      }}
    >
      <div className="max-w-5xl mx-auto" id={DIV_ID} />
      <Script src="https://documentcloud.adobe.com/view-sdk/main.js" />
    </Layout>
  );
};

export default Cv;
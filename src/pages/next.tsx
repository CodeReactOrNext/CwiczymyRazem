import { WhatNextView } from "feature/whatNext/components/WhatNextView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const WhatNextPage: NextPageWithLayout = () => <WhatNextView />;

WhatNextPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='what-next' variant='secondary' wide>
      {page}
    </AppLayout>
  );
};

WhatNextPage.getInitialProps = withAuthInitialProps();

export default WhatNextPage;

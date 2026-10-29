import type { OwnMaterialPageProps } from "feature/landing/lib/ownMaterialProps";
import { buildOwnMaterialProps } from "feature/landing/lib/ownMaterialProps";
import { OwnMaterialPage } from "feature/landing/OwnMaterialPage";
import type { GetStaticProps } from "next";

const GuitarTabEditor = (props: OwnMaterialPageProps) => (
  <OwnMaterialPage {...props} />
);

export const getStaticProps: GetStaticProps<
  OwnMaterialPageProps
> = async () => ({ props: buildOwnMaterialProps() });

export default GuitarTabEditor;

import LandingPage from "feature/landing/LandingPage";
import type { BlogFrontmatter} from "lib/blog";
import {getAllBlogs } from "lib/blog";
import type { GetStaticProps } from "next";
import type { NextPageWithLayout } from "types/page";

interface HomeProps {
  blogs: BlogFrontmatter[];
}

const Home: NextPageWithLayout<HomeProps> = ({ blogs }) => {
  return <LandingPage blogs={blogs} />;
};

export const getStaticProps: GetStaticProps = async () => {
  const blogs = getAllBlogs();
  return {
    props: {
      blogs,
    },
  };
};

Home.minimalLayout = true;

export default Home;



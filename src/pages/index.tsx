import LandingPage from "feature/landing/LandingPage";
import type { BlogFrontmatter} from "lib/blog";
import {getAllBlogs } from "lib/blog";
import type { GetStaticProps, NextPage } from "next";

interface HomeProps {
  blogs: BlogFrontmatter[];
}

const Home: NextPage<HomeProps> = ({ blogs }) => {
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

export default Home;



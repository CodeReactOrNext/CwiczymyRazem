import type { GetStaticProps, NextPage } from "next";
import LandingPage from "feature/landing/LandingPage";
import { getAllBlogs, BlogFrontmatter } from "lib/blog";

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



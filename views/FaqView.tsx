import FaqLayout, { faqQuestionInterface } from "layouts/FaqLayout/FaqLayout";

const FaqView = () => {
  const faqQuestion: faqQuestionInterface[] = [
    {
      title: "O co chodzi?",
      message:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis fermentum lorem non nulla accumsan convallis. Vestibulum sed iaculis neque. Praesent quis magna eu tortor fermentum placerat ac quis risus. Aenean faucibus luctus lectus sit amet mattis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque a auctor risus. Donec ut tellus lacinia, congue ipsum ac, vehicula magna.Vestibulum eu congue urna. Mauris eu posuere nunc. Cras pulvinar metus ac diam molestie, et tincidunt neque pretium. Nunc nec arcu nunc. Fusce euismod dignissim pulvinar. Pellentesque nec dictum lectus. Etiam enim ipsum, ultricies sit amet dui eu, maximus cursus dolor. Mauris tortor massa, dictum sit amet bibendum interdum, faucibus interdum quam. Phasellus consectetur nisi quis purus porta, vel bibendum libero vehicula. Sed non aliquet libero. Proin sit amet nulla metus.",
    },
    {
      title: "O co chodzi?",
      message:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis fermentum lorem non nulla accumsan convallis. Vestibulum sed iaculis neque. Praesent quis magna eu tortor fermentum placerat ac quis risus. Aenean faucibus luctus lectus sit amet mattis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque a auctor risus. Donec ut tellus lacinia, congue ipsum ac, vehicula magna.Vestibulum eu congue urna. Mauris eu posuere nunc. Cras pulvinar metus ac diam molestie, et tincidunt neque pretium. Nunc nec arcu nunc. Fusce euismod dignissim pulvinar. Pellentesque nec dictum lectus. Etiam enim ipsum, ultricies sit amet dui eu, maximus cursus dolor. Mauris tortor massa, dictum sit amet bibendum interdum, faucibus interdum quam. Phasellus consectetur nisi quis purus porta, vel bibendum libero vehicula. Sed non aliquet libero. Proin sit amet nulla metus.",
    },
    {
      title: "O co chodzi?",
      message:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis fermentum lorem non nulla accumsan convallis. Vestibulum sed iaculis neque. Praesent quis magna eu tortor fermentum placerat ac quis risus. Aenean faucibus luctus lectus sit amet mattis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Quisque a auctor risus. Donec ut tellus lacinia, congue ipsum ac, vehicula magna.Vestibulum eu congue urna. Mauris eu posuere nunc. Cras pulvinar metus ac diam molestie, et tincidunt neque pretium. Nunc nec arcu nunc. Fusce euismod dignissim pulvinar. Pellentesque nec dictum lectus. Etiam enim ipsum, ultricies sit amet dui eu, maximus cursus dolor. Mauris tortor massa, dictum sit amet bibendum interdum, faucibus interdum quam. Phasellus consectetur nisi quis purus porta, vel bibendum libero vehicula. Sed non aliquet libero. Proin sit amet nulla metus.",
    },
  ];

  return <FaqLayout faqQuestion={faqQuestion} />;
};

export default FaqView;
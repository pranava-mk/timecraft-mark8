
import React from "react";
import Container from "../ui/Container";

const Footer = () => {
  return (
    <footer className="py-8 border-t border-gray-100">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} React App. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-gray-600">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600">
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

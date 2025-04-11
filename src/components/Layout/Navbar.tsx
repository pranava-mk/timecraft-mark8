
import React from "react";
import { Link } from "react-router-dom";
import Container from "../ui/Container";

const Navbar = () => {
  return (
    <nav className="py-4 border-b border-gray-100">
      <Container>
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            React App
          </Link>
          
          <div className="flex gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </Container>
    </nav>
  );
};

export default Navbar;

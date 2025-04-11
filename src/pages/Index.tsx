
import React from "react";
import MainLayout from "../components/Layout/MainLayout";
import Container from "../components/ui/Container";

const Index = () => {
  return (
    <MainLayout>
      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to Your React Application
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              This is a blank React project ready for you to build something amazing.
            </p>
            <div className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors">
              Get Started
            </div>
          </div>
        </Container>
      </section>
      
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Feature {item}</h3>
                <p className="text-gray-600">
                  A short description of this feature and what it does for your application.
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </MainLayout>
  );
};

export default Index;

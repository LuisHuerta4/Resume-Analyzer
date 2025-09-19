import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { resumes } from "../constants";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumatch" },
    { name: "description", content: "Smart feedback for job applications!" },
  ];
}

export default function Home() {
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>
    
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Resume Match Ratings</h1>
        <h2>Submit applications and receive AI powered feedback</h2>
      </div>
  
      {resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </section>

  </main>;
}

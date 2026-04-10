import Header from './components/Header'
import Hero from './components/Hero'
import Modules from './components/Modules'
import Process from './components/Process'
import CTA from './components/CTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="w-[1280px] mx-auto flex flex-col items-center bg-[#EBEBEB]">
      <div className="h-[19px]" />
      <Header />
      <div className="h-[16px]" />
      <Hero />
      <div className="h-[368px]" />
      <Modules />
      <div className="h-[4px]" />
      <Process />
      <div className="h-[4px]" />
      <CTA />
      <div className="h-[422px]" />
      <Footer />
      <div className="h-[10px]" />
    </div>
  )
}

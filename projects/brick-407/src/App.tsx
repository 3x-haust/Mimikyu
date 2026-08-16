import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HeroHeadline from './components/HeroHeadline'
import Intro from './components/Intro'
import Process from './components/Process'
import Search from './components/Search'
import Cases from './components/Cases'
import Faq from './components/Faq'
import HelloBar from './components/HelloBar'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="w-[1280px] h-[6298px] bg-[#ebebeb] relative mx-auto overflow-hidden">
      <Hero />
      <HeroHeadline />
      <Intro />
      <Process />
      <Search />
      <Cases />
      <Faq />
      <HelloBar />
      <Footer />
      <Navbar />
    </div>
  )
}

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
      <div style={{ transform: 'translateX(0.5px)' }}><Header /></div>
      <div className="h-[16px]" />
      <div style={{ transform: 'translateX(0.5px)' }}><Hero /></div>
      <div className="h-[368px]" />
      <div style={{ transform: 'translateX(0.5px)' }}><Modules /></div>
      <div className="h-[4px]" />
      <div style={{ transform: 'translateX(0.5px)' }}><Process /></div>
      <div className="h-[4px]" />
      <div style={{ transform: 'translateX(-1.5px)' }}><CTA /></div>
      <div className="h-[422px]" />
      <div style={{ transform: 'translateX(0.5px)' }}><Footer /></div>
      <div className="h-[10px]" />
    </div>
  )
}

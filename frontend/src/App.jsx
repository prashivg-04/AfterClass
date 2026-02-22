import './App.css'
import { supabase } from "./lib/supabase"

function App() {

  console.log("Supabase connected:", supabase)

  return (
    <div className='font-black'>Hellow</div>
  )
}

export default App

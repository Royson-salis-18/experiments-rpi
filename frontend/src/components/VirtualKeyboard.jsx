import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isTextLike(el) {
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (tag === "textarea") return true
  if (tag !== "input") return false
  const type = (el.getAttribute("type") || "text").toLowerCase()
  return ["text", "search", "email", "password", "url", "tel", "number"].includes(type)
}

// Get the native value setter to trigger React's synthetic onChange
function getNativeSetter(el) {
  const proto = el.tagName === "TEXTAREA"
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype
  return Object.getOwnPropertyDescriptor(proto, "value")?.set
}

function setReactValue(el, newVal) {
  try {
    const setter = getNativeSetter(el)
    if (setter) setter.call(el, newVal)
    else el.value = newVal
  } catch {
    el.value = newVal
  }
  el.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertChar(el, char) {
  if (!el) return
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? start
  const val = el.value || ""
  const newVal = val.slice(0, start) + char + val.slice(end)
  const pos = start + char.length
  setReactValue(el, newVal)
  el.setSelectionRange?.(pos, pos)
}

function doBackspace(el) {
  if (!el) return
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const val = el.value || ""
  let newVal, pos
  if (start !== end) {
    newVal = val.slice(0, start) + val.slice(end)
    pos = start
  } else if (start > 0) {
    newVal = val.slice(0, start - 1) + val.slice(end)
    pos = start - 1
  } else { return }
  setReactValue(el, newVal)
  el.setSelectionRange?.(pos, pos)
}

// ─── Key layouts ─────────────────────────────────────────────────────────────
const ROWS_LOWER = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["SHIFT","z","x","c","v","b","n","m","⌫"],
  ["@",".com","SPACE",".","-","DONE"],
]
const ROWS_UPPER = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["SHIFT","Z","X","C","V","B","N","M","⌫"],
  ["@",".com","SPACE",".","-","DONE"],
]

// ─── Single Key ───────────────────────────────────────────────────────────────
function Key({ label, onPress, wide, veryWide, accent, danger, subtle }) {
  const base =
    "flex items-center justify-center rounded-xl select-none active:scale-95 transition-all duration-75 text-white font-medium text-sm h-12 " +
    "touch-manipulation cursor-pointer border "

  const color = danger
    ? "bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-300"
    : accent
    ? "bg-emerald-500 border-emerald-400/30 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
    : subtle
    ? "bg-slate-700/60 border-white/5 hover:bg-slate-700 text-gray-300"
    : "bg-slate-700 border-white/10 hover:bg-slate-600"

  const width = veryWide ? "flex-[3]" : wide ? "flex-[2]" : "flex-1"

  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault() // prevent focus loss on the target input
        onPress(label)
      }}
      className={`${base}${color} ${width} min-w-0`}
    >
      {label === "SPACE" ? "space" : label === "⌫" ? "⌫" : label === "SHIFT" ? "⇧" : label === "DONE" ? "Done ✓" : label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VirtualKeyboard() {
  const [visible, setVisible] = useState(false)
  const [shift, setShift] = useState(false)
  const targetRef = useRef(null)

  // Toggle keyboard-open class on body — CSS handles the inner scroll container padding
  useEffect(() => {
    if (visible) {
      document.body.classList.add("keyboard-open")
    } else {
      document.body.classList.remove("keyboard-open")
    }
    return () => { document.body.classList.remove("keyboard-open") }
  }, [visible])

  // Watch for focus on any text input
  useEffect(() => {
    function onFocusIn(e) {
      const el = e.target
      if (isTextLike(el) && !el.readOnly && !el.disabled) {
        targetRef.current = el
        setVisible(true)
      }
    }
    function onFocusOut(e) {
      // Small delay so DONE button click can run first
      setTimeout(() => {
        const active = document.activeElement
        if (!active || !isTextLike(active)) {
          setVisible(false)
        }
      }, 150)
    }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [])

  // Scroll the focused input above the keyboard
  useEffect(() => {
    if (!visible || !targetRef.current) return
    setTimeout(() => {
      const el = targetRef.current
      if (!el) return
      
      const scroller = document.getElementById("main-scroll")
      if (!scroller) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }

      const elRect = el.getBoundingClientRect()
      const kbHeight = 360
      const margin = 24 // A bit more padding
      const visibleBottom = window.innerHeight - kbHeight - margin
      
      if (elRect.bottom > visibleBottom) {
        // How much we need to scroll up inside the scroller
        const offset = elRect.bottom - visibleBottom
        scroller.scrollBy({ top: offset, behavior: "smooth" })
      }
    }, 280) // Wait for padding animation to complete
  }, [visible])

  const rows = shift ? ROWS_UPPER : ROWS_LOWER

  const handleKey = (label) => {
    const el = targetRef.current
    if (!el) return

    if (label === "⌫") { doBackspace(el); return }
    if (label === "SPACE") { insertChar(el, " "); return }
    if (label === "DONE") { setVisible(false); el.blur(); return }
    if (label === "SHIFT") { setShift((s) => !s); return }
    if (label === ".com") { insertChar(el, ".com"); return }
    insertChar(el, label)
    if (shift) setShift(false) // auto-unshift after one capital
  }

  const keyboard = visible ? (
    <div
      className="keyboard-panel fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900 border-t border-white/10 shadow-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      {/* Handle bar */}
      <div
        className="flex justify-center pt-2 pb-1 cursor-pointer"
        onPointerDown={(e) => { e.preventDefault(); setVisible(false); targetRef.current?.blur() }}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Input preview */}
      <div className="px-3 pb-2">
        <div className="bg-slate-800 rounded-lg px-3 py-2 text-white text-sm truncate min-h-[32px] border border-white/10 flex items-center justify-between gap-2">
          <span className="truncate opacity-70">
            {targetRef.current?.placeholder ? `Editing: ${targetRef.current.placeholder}` : "Typing…"}
          </span>
          <button
            onPointerDown={(e) => { e.preventDefault(); setVisible(false); targetRef.current?.blur() }}
            className="text-xs text-gray-400 hover:text-white transition-colors shrink-0 bg-white/5 px-2 py-1 rounded"
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Keys */}
      <div className="px-2 pb-3 space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((k) => (
              <Key
                key={k}
                label={k}
                onPress={handleKey}
                wide={k === "SHIFT" || k === "⌫"}
                veryWide={k === "SPACE"}
                accent={k === "DONE"}
                danger={k === "⌫"}
                subtle={k === "SHIFT" || k === "@" || k === ".com" || k === "." || k === "-"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  ) : null

  return createPortal(keyboard, document.body)
}

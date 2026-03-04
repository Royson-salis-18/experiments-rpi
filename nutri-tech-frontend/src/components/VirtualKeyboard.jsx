import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

function isTextLike(el) {
  if (!el) return false
  const tag = el.tagName?.toLowerCase()
  if (tag === "textarea") return true
  if (tag !== "input") return false
  const type = (el.getAttribute("type") || "text").toLowerCase()
  return ["text", "search", "email", "password", "url", "tel", "number"].includes(type)
}

function insertText(el, text) {
  if (!el) return
  const start = el.selectionStart ?? el.value?.length ?? 0
  const end = el.selectionEnd ?? start
  if (typeof el.setRangeText === "function") {
    el.setRangeText(text, start, end, "end")
  } else {
    const val = el.value || ""
    el.value = val.slice(0, start) + text + val.slice(end)
    const pos = start + text.length
    if (typeof el.setSelectionRange === "function") el.setSelectionRange(pos, pos)
  }
  const evt = new Event("input", { bubbles: true })
  el.dispatchEvent(evt)
}

function pressBackspace(el) {
  if (!el) return
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  if (start !== end) {
    insertText(el, "")
    return
  }
  if (start === 0) return
  const val = el.value || ""
  const newVal = val.slice(0, start - 1) + val.slice(end)
  el.value = newVal
  const pos = start - 1
  if (typeof el.setSelectionRange === "function") el.setSelectionRange(pos, pos)
  const evt = new Event("input", { bubbles: true })
  el.dispatchEvent(evt)
}

export default function VirtualKeyboard() {
  const [visible, setVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [shift, setShift] = useState(false)
  const targetRef = useRef(null)
  const kbRef = useRef(null)

  useEffect(() => {
    function onFocusIn(e) {
      const el = e.target
      if (isTextLike(el) && !el.readOnly && !el.disabled) {
        targetRef.current = el
        setVisible(true)
        setCollapsed(false)
      }
    }
    function onMouseDown(e) {
      const el = e.target
      if (!kbRef.current) return
      const insideKb = kbRef.current.contains(el)
      const insideInput = targetRef.current && targetRef.current.contains ? targetRef.current.contains(el) : el === targetRef.current
      if (!insideKb && !insideInput) {
        if (visible) setCollapsed(true)
      }
    }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("mousedown", onMouseDown)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [visible])

  const rows = useMemo(() => {
    const letters1 = "qwertyuiop".split("")
    const letters2 = "asdfghjkl".split("")
    const letters3 = "zxcvbnm".split("")
    const nums = "1234567890".split("")
    const mapCase = (arr) => arr.map((c) => (shift ? c.toUpperCase() : c))
    return [
      mapCase(nums),
      mapCase(letters1),
      mapCase(letters2),
      ["Shift", ...mapCase(letters3), "Backspace"],
      ["Space", "Enter"],
    ]
  }, [shift])

  if (!visible) return null

  const onKeyPress = (k) => {
    const el = targetRef.current
    if (!el) return
    if (k === "Backspace") {
      pressBackspace(el)
      return
    }
    if (k === "Space") {
      insertText(el, " ")
      return
    }
    if (k === "Enter") {
      insertText(el, "\n")
      return
    }
    if (k === "Shift") {
      setShift((s) => !s)
      return
    }
    insertText(el, k)
  }

  const root = document.body

  return createPortal(
    <div
      className={`fixed left-0 right-0 bottom-0 z-50 transition-all duration-200 ${collapsed ? "translate-y-[calc(100%-44px)]" : "translate-y-0"}`}
      style={{ pointerEvents: "none" }}
    >
      <div className="mx-auto max-w-screen-lg px-3 pb-3" style={{ pointerEvents: "auto" }}>
        <div ref={kbRef} className="rounded-2xl bg-dashboard-surface/90 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <div className="text-xs font-bold tracking-widest uppercase text-dashboard-text-muted">Keyboard</div>
            <button onClick={() => setCollapsed((c) => !c)} className="text-xs text-dashboard-text-muted hover:text-white px-2 py-1">
              {collapsed ? "Expand" : "Shrink"}
            </button>
          </div>
          <div className="p-3 space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex justify-center gap-1">
                {row.map((k) => (
                  <button
                    key={k}
                    onClick={() => onKeyPress(k)}
                    className={`px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition text-sm text-white ${k === "Space" ? "flex-1" : ""}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    root
  )
}

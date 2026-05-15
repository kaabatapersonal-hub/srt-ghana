import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { submitReport } from "../services/reportService";
import Navbar from "../components/Navbar";

const CONDITION_MAP = { "1": "good", "2": "fair", "3": "poor", "4": "critical" };

const PLACEHOLDER = {
  dial:       "Dial *713# to begin",
  menu:       "Enter option (1–3)",
  name:       "Enter facility name",
  condition:  "Enter option (1–4)",
  submitting: "Sending...",
  done:       "Session complete",
  end_static: "Session ended",
};

function USSDPage() {
  const { currentUser } = useAuth();

  const [step,         setStep]         = useState("dial");
  const [history,      setHistory]      = useState([]);
  const [inputVal,     setInputVal]     = useState("");
  const [inputErr,     setInputErr]     = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const screenRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (screenRef.current)
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
  }, [history]);

  function reject(msg, restoreVal) {
    setInputErr(msg);
    if (restoreVal !== undefined) setInputVal(restoreVal);
  }

  async function handleSend() {
    const val = inputVal.trim();
    if (!val || isSubmitting) return;

    setInputErr("");
    setInputVal("");

    const withUser = [...history, { from: "user", text: val }];

    switch (step) {
      case "dial": {
        if (val !== "*713#") { reject("Enter *713# to connect", val); return; }
        const next = [...withUser, { from: "system", text: "Welcome to SRT\n────────────\n1. Report Facility\n2. Check Status\n3. Emergency Alert" }];
        setHistory(next); setStep("menu"); break;
      }

      case "menu": {
        if (!["1","2","3"].includes(val)) { reject("Enter 1, 2, or 3", val); return; }
        if (val === "1") {
          setHistory([...withUser, { from: "system", text: "Report Facility\n────────────\nEnter facility name:" }]);
          setStep("name");
        } else if (val === "2") {
          setHistory([...withUser, { from: "system", text: "Check Status\n────────────\nNo reports found.\nDial *713# to submit\na new report." }]);
          setStep("end_static");
        } else {
          setHistory([...withUser, { from: "system", text: "Emergency Alert\n────────────\nAlert sent to NADMO.\nDistrict office notified.\nExpected response: 2hrs\n\nDial *713# for new report." }]);
          setStep("end_static");
        }
        break;
      }

      case "name": {
        if (val.length < 2) { reject("Name too short", val); return; }
        setFacilityName(val);
        setHistory([...withUser, { from: "system", text: "Select condition:\n────────────\n1. Good\n2. Fair\n3. Poor\n4. Critical" }]);
        setStep("condition");
        break;
      }

      case "condition": {
        if (!["1","2","3","4"].includes(val)) { reject("Enter 1, 2, 3, or 4", val); return; }
        const conditionStatus = CONDITION_MAP[val];
        const sending = [...withUser, { from: "system", text: "Sending report..." }];
        setHistory(sending);
        setIsSubmitting(true);
        setStep("submitting");

        try {
          const newId = await submitReport({
            facilityName,
            facilityType:    "other",
            conditionStatus,
            description:     "Submitted via USSD *713#",
            location:        null,
            source:          "ussd",
          }, currentUser);

          const ref = "SRT-" + newId.slice(-5).toUpperCase();
          setHistory([...sending, {
            from: "system",
            text: `Report submitted!\nRef: ${ref}\n────────────\nThank you.\nDial *713# to submit\nanother report.`,
          }]);
          setStep("done");
        } catch {
          setHistory([...sending, { from: "system", text: "Network error.\nPlease try again." }]);
          setStep("condition");
        } finally {
          setIsSubmitting(false);
        }
        break;
      }

      default: break;
    }

    inputRef.current?.focus();
  }

  function handleReset() {
    setStep("dial"); setHistory([]); setInputVal("");
    setInputErr(""); setFacilityName(""); setIsSubmitting(false);
    inputRef.current?.focus();
  }

  const isDisabled = step === "submitting" || step === "done" || step === "end_static";
  const now        = new Date();
  const timeStr    = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");

  return (
    <div className="ussd-page-wrapper page-fade-in">
      <Navbar />

      <div className="ussd-page">
        <div className="ussd-page-header">
          <h1 className="ussd-page-title">USSD Simulator</h1>
          <p className="ussd-page-sub">
            Simulates the <strong>*713#</strong> interface on any basic feature phone — no internet required
          </p>
        </div>

        <div className="ussd-phone">
          <div className="ussd-phone-top">
            <div className="ussd-speaker" />
          </div>

          <div className="ussd-status-bar">
            <span>MTN GH</span>
            <span className="ussd-status-code">*713#</span>
            <span>{timeStr}</span>
          </div>

          <div className="ussd-screen" ref={screenRef}>
            {history.length === 0 ? (
              <div className="ussd-screen-idle">
                <div className="ussd-idle-code">*713#</div>
                <div className="ussd-idle-hint">Type below and press Send</div>
              </div>
            ) : (
              <div className="ussd-history">
                {history.map((msg, i) => (
                  <div key={i} className={`ussd-msg ussd-msg-${msg.from}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ussd-input-area">
            {inputErr && <div className="ussd-err">{inputErr}</div>}
            <div className="ussd-input-row">
              <input
                ref={inputRef}
                type="text"
                className="ussd-input"
                placeholder={PLACEHOLDER[step] || ""}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                disabled={isDisabled}
                autoComplete="off"
                autoFocus
              />
              <button
                className="ussd-send-btn"
                onClick={handleSend}
                disabled={isDisabled || !inputVal.trim()}
              >
                Send
              </button>
            </div>
            <button className="ussd-reset-btn" onClick={handleReset}>
              ↺ Reset session
            </button>
          </div>

          <div className="ussd-home-btn" />
        </div>

        <p className="ussd-phone-info">
          Simulator only · Reports save to Firestore and appear on the map &amp; admin panel in real time
        </p>
      </div>
    </div>
  );
}

export default USSDPage;

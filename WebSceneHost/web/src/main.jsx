import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";
import { createStore } from "redux";

const samples = [
  ["counter", "Counter", "State", "01"],
  ["temperature", "Temperature", "Binding", "02"],
  ["flight-booker", "Flight Booker", "Constraints", "03"],
  ["timer", "Timer", "Time", "04"],
  ["crud", "CRUD", "Data", "05"],
  ["crud-redux", "CRUD + Redux", "Store", "05R"],
  ["circle-drawer", "Circle Drawer", "Undo", "06"],
  ["cells", "Cells", "Formulae", "07"]
];

function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => {
    setCount(value => value + 1);
  };
  return (
    <SampleCard number="01" title="Counter" description="The smallest useful test of local React state and native pointer dispatch.">
      <div className="counter-row">
        <output className="count-output" data-testid="counter-value">{count}</output>
        <button className="primary" onClick={increment}>Count</button>
      </div>
    </SampleCard>
  );
}

function TemperatureConverter() {
  const [celsius, setCelsius] = useState("");
  const [fahrenheit, setFahrenheit] = useState("");

  function fromCelsius(value) {
    setCelsius(value);
    setFahrenheit(value.trim() === "" || Number.isNaN(Number(value)) ? "" : String(Number(value) * 9 / 5 + 32));
  }

  function fromFahrenheit(value) {
    setFahrenheit(value);
    setCelsius(value.trim() === "" || Number.isNaN(Number(value)) ? "" : String((Number(value) - 32) * 5 / 9));
  }

  return (
    <SampleCard number="02" title="Temperature Converter" description="Bidirectional data flow without a browser input surface.">
      <div className="temperature-row">
        <label><span>Celsius</span><input value={celsius} onChange={event => fromCelsius(event.target.value)} placeholder="0" /></label>
        <span className="equals">=</span>
        <label><span>Fahrenheit</span><input value={fahrenheit} onChange={event => fromFahrenheit(event.target.value)} placeholder="32" /></label>
      </div>
      <p className="hint">Try 100 °C or 212 °F.</p>
    </SampleCard>
  );
}

function parseShortDate(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function FlightBooker() {
  const [flightType, setFlightType] = useState("one-way");
  const [fromDate, setFromDate] = useState("02.08.2026");
  const [toDate, setToDate] = useState("09.08.2026");
  const [message, setMessage] = useState("");
  const start = parseShortDate(fromDate);
  const finish = parseShortDate(toDate);
  const valid = !!start && (flightType === "one-way" || (!!finish && finish >= start));

  function book() {
    const text = flightType === "one-way"
      ? `One-way flight booked for ${fromDate}.`
      : `Return flight booked from ${fromDate} to ${toDate}.`;
    setMessage(text);
  }

  return (
    <SampleCard number="03" title="Flight Booker" description="Input validation, dependent controls, and explicit booking feedback.">
      <div className="form-stack narrow">
        <label><span>Trip type</span><select value={flightType} onChange={event => setFlightType(event.target.value)}>
          <option value="one-way">One-way flight</option>
          <option value="return">Return flight</option>
        </select></label>
        <label><span>Depart</span><input className={start ? "" : "invalid"} value={fromDate} onChange={event => setFromDate(event.target.value)} placeholder="dd.mm.yyyy" /></label>
        <label><span>Return</span><input className={flightType === "return" && !finish ? "invalid" : ""} value={toDate} onChange={event => setToDate(event.target.value)} disabled={flightType === "one-way"} placeholder="dd.mm.yyyy" /></label>
        <button className="primary" onClick={book} disabled={!valid}>Book flight</button>
        <div className={message ? "confirmation visible" : "confirmation"}>{message || "Your booking confirmation will appear here."}</div>
      </div>
    </SampleCard>
  );
}

function Timer() {
  const [duration, setDuration] = useState(10);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (elapsed >= duration) return undefined;
    const timer = setInterval(() => setElapsed(value => Math.min(value + 0.1, duration)), 100);
    return () => clearInterval(timer);
  }, [duration, elapsed >= duration]);

  const progress = duration === 0 ? 1 : elapsed / duration;
  return (
    <SampleCard number="04" title="Timer" description="A live scheduling and scene-publication test driven by React effects.">
      <div className="timer-readout"><strong>{elapsed.toFixed(1)}</strong><span> / {duration.toFixed(1)} seconds</span></div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(progress * 100, 100)}%` }} /></div>
      <label className="range-label"><span>Duration</span><input type="range" min="1" max="20" step="0.5" value={duration} onChange={event => setDuration(Number(event.target.value))} /></label>
      <button className="primary" onClick={() => setElapsed(0)}>Reset timer</button>
    </SampleCard>
  );
}

const seedUsers = [
  { id: 1, name: "Hans", surname: "Emil" },
  { id: 2, name: "Max", surname: "Mustermann" },
  { id: 3, name: "Roman", surname: "Tisch" },
  { id: 4, name: "Ada", surname: "Lovelace" },
  { id: 5, name: "Grace", surname: "Hopper" }
];

function Crud() {
  const [users, setUsers] = useState(seedUsers);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(1);
  const [name, setName] = useState("Hans");
  const [surname, setSurname] = useState("Emil");
  const nextId = useRef(6);
  const visibleUsers = users.filter(user => user.surname.toLowerCase().startsWith(filter.toLowerCase()));

  function choose(value) {
    const id = Number(value);
    const user = users.find(candidate => candidate.id === id);
    setSelected(id);
    setName(user?.name ?? "");
    setSurname(user?.surname ?? "");
  }

  function create() {
    if (!name.trim() && !surname.trim()) return;
    setUsers(current => [...current, { id: nextId.current++, name: name.trim(), surname: surname.trim() }]);
  }

  function update() {
    setUsers(current => current.map(user => user.id === selected ? { ...user, name: name.trim(), surname: surname.trim() } : user));
  }

  function remove() {
    setUsers(current => current.filter(user => user.id !== selected));
    setSelected(null);
    setName("");
    setSurname("");
  }

  return (
    <SampleCard number="05" title="CRUD" description="Filtering, selection, creation, update, and deletion over shared React state.">
      <label className="filter-field"><span>Filter surname by prefix</span><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Try H" /></label>
      <div className="crud-grid">
        <div className="user-list">
          {visibleUsers.map(user => <button key={user.id} className={selected === user.id ? "user-row selected" : "user-row"} onClick={() => choose(user.id)}>{user.surname}, {user.name}</button>)}
        </div>
        <div className="form-stack">
          <label><span>Name</span><input value={name} onChange={event => setName(event.target.value)} /></label>
          <label><span>Surname</span><input value={surname} onChange={event => setSurname(event.target.value)} /></label>
        </div>
      </div>
      <div className="button-row">
        <button className="primary" onClick={create}>Create</button>
        <button onClick={update} disabled={selected === null}>Update</button>
        <button className="danger" onClick={remove} disabled={selected === null}>Delete</button>
      </div>
    </SampleCard>
  );
}

const reduxInitialState = {
  users: seedUsers,
  filter: "",
  selected: 1,
  edit: { name: "Hans", surname: "Emil" },
  nextId: 6
};

function crudReduxReducer(state = reduxInitialState, action) {
  switch (action.type) {
    case "FILTER":
      return { ...state, filter: action.value };
    case "SELECT": {
      const user = state.users.find(candidate => candidate.id === action.id);
      return { ...state, selected: action.id, edit: { name: user?.name ?? "", surname: user?.surname ?? "" } };
    }
    case "EDIT":
      return { ...state, edit: { ...state.edit, [action.field]: action.value } };
    case "CREATE":
      if (!state.edit.name.trim() && !state.edit.surname.trim()) return state;
      return { ...state, nextId: state.nextId + 1, users: [...state.users, { id: state.nextId, name: state.edit.name.trim(), surname: state.edit.surname.trim() }] };
    case "UPDATE":
      return { ...state, users: state.users.map(user => user.id === state.selected ? { ...user, ...state.edit } : user) };
    case "DELETE":
      return { ...state, users: state.users.filter(user => user.id !== state.selected), selected: null, edit: { name: "", surname: "" } };
    default:
      return state;
  }
}

const crudReduxStore = createStore(crudReduxReducer);

function CrudReduxPanel() {
  const dispatch = useDispatch();
  const state = useSelector(value => value);
  const visibleUsers = state.users.filter(user => user.surname.toLowerCase().startsWith(state.filter.toLowerCase()));
  return (
    <SampleCard number="05R" title="CRUD + Redux" description="The repository's Redux variant, upgraded to Redux 5 and React-Redux 9.">
      <div className="redux-badge">REDUX STORE</div>
      <label className="filter-field"><span>Filter surname by prefix</span><input value={state.filter} onChange={event => dispatch({ type: "FILTER", value: event.target.value })} /></label>
      <div className="crud-grid redux-crud">
        <div className="user-list">
          {visibleUsers.map(user => <button key={user.id} className={state.selected === user.id ? "user-row selected" : "user-row"} onClick={() => dispatch({ type: "SELECT", id: user.id })}>{user.surname}, {user.name}</button>)}
        </div>
        <div className="form-stack">
          <label><span>Name</span><input value={state.edit.name} onChange={event => dispatch({ type: "EDIT", field: "name", value: event.target.value })} /></label>
          <label><span>Surname</span><input value={state.edit.surname} onChange={event => dispatch({ type: "EDIT", field: "surname", value: event.target.value })} /></label>
        </div>
      </div>
      <div className="button-row">
        <button className="primary" onClick={() => dispatch({ type: "CREATE" })}>Create</button>
        <button onClick={() => dispatch({ type: "UPDATE" })} disabled={state.selected === null}>Update</button>
        <button className="danger" onClick={() => dispatch({ type: "DELETE" })} disabled={state.selected === null}>Delete</button>
      </div>
    </SampleCard>
  );
}

function CrudRedux() {
  return <Provider store={crudReduxStore}><CrudReduxPanel /></Provider>;
}

function CircleDrawer() {
  const [circles, setCircles] = useState([
    { id: 1, x: 150, y: 120, radius: 34 },
    { id: 2, x: 330, y: 80, radius: 24 },
    { id: 3, x: 490, y: 155, radius: 42 }
  ]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [selected, setSelected] = useState(null);

  function commit(next) {
    setHistory(items => [...items, circles]);
    setCircles(next);
    setFuture([]);
  }

  function canvasClick(event) {
    const point = { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    const hit = circles.find(circle => Math.hypot(circle.x - point.x, circle.y - point.y) <= circle.radius);
    if (hit) {
      setSelected(hit.id);
      return;
    }
    commit([...circles, { id: Date.now() + Math.random(), x: point.x, y: point.y, radius: 28 }]);
    setSelected(null);
  }

  function resize(value) {
    const radius = Number(value);
    commit(circles.map(circle => circle.id === selected ? { ...circle, radius } : circle));
  }

  function undo() {
    if (!history.length) return;
    setFuture(items => [...items, circles]);
    setCircles(history[history.length - 1]);
    setHistory(items => items.slice(0, -1));
    setSelected(null);
  }

  function redo() {
    if (!future.length) return;
    setHistory(items => [...items, circles]);
    setCircles(future[future.length - 1]);
    setFuture(items => items.slice(0, -1));
    setSelected(null);
  }

  const selectedCircle = circles.find(circle => circle.id === selected);
  return (
    <SampleCard wide number="06" title="Circle Drawer" description="Native SVG scene output with hit testing and an undo/redo history.">
      <div className="button-row compact"><button onClick={undo} disabled={!history.length}>Undo</button><button onClick={redo} disabled={!future.length}>Redo</button><span className="hint">Click the canvas to add a circle; select one to resize it.</span></div>
      {selectedCircle && <label className="diameter-control"><span>Diameter: {selectedCircle.radius * 2}px</span><input type="range" min="10" max="100" value={selectedCircle.radius} onChange={event => resize(event.target.value)} /></label>}
      <svg className="circle-canvas" onClick={canvasClick}>
        {circles.map(circle => <circle key={circle.id} cx={circle.x} cy={circle.y} r={circle.radius} className={circle.id === selected ? "circle selected" : "circle"} onClick={event => { event.stopPropagation(); setSelected(circle.id); }} />)}
      </svg>
    </SampleCard>
  );
}

const columns = ["A", "B", "C", "D", "E", "F", "G", "H"];
const rows = Array.from({ length: 12 }, (_, index) => index + 1);
const initialCells = {
  A1: "12", A2: "18", A3: "25", A4: "31",
  B1: "7", B2: "11", B3: "14", B4: "19",
  C1: "=A1+B1", C2: "=A2+B2", C3: "=A3+B3", C4: "=A4+B4",
  E1: "Quarter", E2: "Q3 2026", G1: "Total", G2: "=SUM(C1:C4)"
};

function evaluateCell(address, cells, stack = []) {
  if (stack.includes(address)) return "#CYCLE";
  const source = cells[address] ?? "";
  if (!source.startsWith("=")) return source;
  let expression = source.slice(1).toUpperCase();
  expression = expression.replace(/SUM\(([A-H])(\d+):([A-H])(\d+)\)/g, (_, c1, r1, c2, r2) => {
    const values = [];
    for (let row = Number(r1); row <= Number(r2); row++) {
      for (let col = columns.indexOf(c1); col <= columns.indexOf(c2); col++) values.push(Number(evaluateCell(`${columns[col]}${row}`, cells, [...stack, address])) || 0);
    }
    return String(values.reduce((sum, value) => sum + value, 0));
  });
  expression = expression.replace(/\b([A-H]\d+)\b/g, reference => String(Number(evaluateCell(reference, cells, [...stack, address])) || 0));
  if (!/^[\d\s+\-*/().]+$/.test(expression)) return "#ERROR";
  try {
    const result = Function(`"use strict"; return (${expression});`)();
    return Number.isFinite(result) ? String(result) : "#ERROR";
  } catch {
    return "#ERROR";
  }
}

function Cells() {
  const [cells, setCells] = useState(initialCells);
  const [selected, setSelected] = useState("C1");
  const formula = cells[selected] ?? "";
  return (
    <SampleCard wide number="07" title="Cells" description="The missing upstream benchmark, completed here with formula references and SUM ranges.">
      <div className="formula-bar"><strong>{selected}</strong><input value={formula} onChange={event => setCells(current => ({ ...current, [selected]: event.target.value }))} aria-label="Formula" /></div>
      <div className="sheet-wrap">
        <table className="sheet">
          <thead><tr><th></th>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row}><th>{row}</th>{columns.map(column => {
            const address = `${column}${row}`;
            return <td key={address} className={selected === address ? "active" : ""} onClick={() => setSelected(address)}>{evaluateCell(address, cells)}</td>;
          })}</tr>)}</tbody>
        </table>
      </div>
    </SampleCard>
  );
}

const views = {
  "counter": Counter,
  "temperature": TemperatureConverter,
  "flight-booker": FlightBooker,
  "timer": Timer,
  "crud": Crud,
  "crud-redux": CrudRedux,
  "circle-drawer": CircleDrawer,
  "cells": Cells
};

function SampleCard({ number, title, description, wide = false, children }) {
  return (
    <section className={wide ? "sample-card wide" : "sample-card"} data-sample-title={title}>
      <header className="sample-heading"><span className="sample-number">{number}</span><div><h1>{title}</h1><p>{description}</p></div></header>
      <div className="sample-body">{children}</div>
    </section>
  );
}

function App() {
  const [active, setActive] = useState("counter");
  useEffect(() => {
    window.__webSceneSevenGuis = {
      ready: true,
      show(sample) {
        if (views[sample]) setActive(sample);
      }
    };
  }, []);
  const View = views[active];
  const activeName = useMemo(() => samples.find(sample => sample[0] === active)?.[1] ?? active, [active]);
  return (
    <main className="shell">
      <aside className="rail">
        <div className="rail-title"><span>THE</span><strong>7 GUIs</strong><small>REACT EDITION</small></div>
        <nav>{samples.map(([id, label, theme, number]) => <button key={id} className={active === id ? "nav-item active" : "nav-item"} onClick={() => setActive(id)}><span>{number}</span><strong>{label}</strong><small>{theme}</small></button>)}</nav>
        <div className="runtime-note"><span className="pulse" /><div><strong>WebScene 1.0.17</strong><small>Native scene active</small></div></div>
      </aside>
      <div className="workspace">
        <div className="workspace-top"><span>7GUIs / {activeName}</span><span className="offline">OFFLINE COMPONENT</span></div>
        <div className="stage" data-active-sample={active}><View /></div>
      </div>
    </main>
  );
}

createRoot(document.getElementById("app")).render(<App />);

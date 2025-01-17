import MicroModal from "micromodal";
import Split from "split.js";
// import { verifyAFD } from "./afd.js";
import { verifyAFND } from "./afnd.js";
import { verifyTM } from "./tm.js";
import { renderError, renderOut, renderOutString } from "./animateNode.js";
import { clearAutomata, createAutomata } from "./automata.js";
import { createMachine, clearMachine } from "./turingMachine.js";
import { startDragTools } from "./dragTools.js";
import { initGraph } from "./graph.js";
import { CircleShape, FILL_NODE_FINAL } from "./shapes.js";
import download from "./utils/download.js";

const { graph, paper } = initGraph();
const inputString = document.querySelector("#input-string");
// const inputEl = document.querySelector("#input-label-name");
const inputLabel = document.querySelector("#input-label-name");
const inputState = document.querySelector("#input-state-name");
const btnClearAll = document.querySelector("#btn-clear-all");
const btnDownload = document.querySelector("#btn-download");
const btnChangeSim = document.querySelector("#btn-changeSim");

const automata = createAutomata();
const machine = createMachine();
let mode = 1;

function run() {
  const data = graph.toJSON();
  const elements = paper.model.getElements();
  const states = {};
  const finalStates = [];
  const alphabet = [];
  const string = inputString.value;
  const statesArr = [];
  const transitions = {};
  const moveSet = {};

  // clear errors
  renderError(null);

  elements.forEach((el) => {
    if (el.attributes.type === "Circle") {
      states[el.attributes.id] = {
        text: el.attributes.attrs.label.text,
        id: el.attributes.id,
      };

      transitions[el.attributes.attrs.label.text] = {};

      if (el.attributes.attrs.body.fill === FILL_NODE_FINAL) {
        finalStates.push(el.attributes.attrs.label.text);
      }
    }
  });

  if (mode === 1) {

    data.cells.forEach((el) => {
      if (el.type === "Link") {
        alphabet.push(...el.labels[0].attrs.text.text.split(","));

        el.labels[0].attrs.text.text.split(",").forEach((symbol) => {
          if (transitions[states[el.source.id].text].length >= 0) {
            transitions[states[el.source.id].text].push([
              states[el.target.id].text,
              symbol,
            ]);
          } else {
            transitions[states[el.source.id].text] = [
              [states[el.target.id].text, symbol],
            ];
          }
        });
      }
    });
  }
  else {
    data.cells.forEach((el) => {
      if (el.type === "Link") {
        alphabet.push(...el.labels[0].attrs.text.text.split("/")[0]);
        el.labels[0].attrs.text.text.split(",").forEach((symbol) => {
        let write = el.labels[0].attrs.text.text.split("/")[1]; 
        let move = el.labels[0].attrs.text.text.split("/")[2];
          if (transitions[states[el.source.id].text].length >= 0) {
            transitions[states[el.source.id].text].push([
              states[el.target.id].text,
              symbol[0],
            ]);
            moveSet[states[el.source.id].text].push([
              write, move
            ]);
          } else {
            transitions[states[el.source.id].text] = [
              [states[el.target.id].text, symbol[0]],
            ];
            moveSet[states[el.source.id].text] = [write, move]
          }
        });
      }

    });
  }
  Object.values(states).forEach((state) => statesArr.push(state.text));

  if (statesArr.length <= 0) {
    renderError("No states");
    return;
  }

  if (!statesArr.includes("q0")) {
    renderError("Initial state not found: q0");
    return;
  }


if(mode === 1){
  automata.alphabet = alphabet;
  automata.initialState = "q0";
  automata.states = statesArr;
  automata.finalStates = finalStates;
  automata.transitions = transitions;
  console.log(automata);
}
else{
  machine.alphabet = alphabet;
  machine.initialState = "q0";
  machine.states = statesArr;
  machine.finalStates = finalStates;
  machine.transitions = transitions;
  machine.moveSet = moveSet;
  console.log(machine);
}

  renderOut("Loading ...");
  renderOutString(string);
  // verifyAFD(paper, graph, automata, string);

  if(mode === 1){
    const res = verifyAFND(paper, graph, automata, string);
    console.log(res);
  } else{
    const res = verifyTM(paper, graph, machine, string);
  }
}

function changeLabelName() {
  const id = inputLabel.getAttribute("link-id");
  const currentLink = graph.getLinks().find((link) => link.id === id);

  currentLink.label(0, {
    attrs: {
      text: {
        text: inputLabel.value || "λ",
      },
    },
  });

  inputLabel.value = "";
  MicroModal.close("modal-label-name");
}

function changeStateName() {
  const id = inputState.getAttribute("state-id");
  const data = paper.model.getElements().find((el) => {
    return el.id === id;
  });

  if (data) data.attr("label/text", inputState.value);

  inputState.value = "";
  MicroModal.close("modal-state-name");
}

window.addEventListener("DOMContentLoaded", () => {
  MicroModal.init();
  Split(["#paper", "#split-1"], { sizes: [80, 20], minSize: 300 });

  startDragTools(graph);

  const circle = new CircleShape({
    position: { x: 50, y: 250 },
    attrs: { label: { text: "q0" } },
  });

  circle.addTo(graph);

  document.querySelector("#run").addEventListener("click", run);
});

// RESIZE WINDOW
window.addEventListener("resize", () => {
  paper.setDimensions(document.body.clientWidth);
});

// Button change label name
// document.querySelector("#btn-label-name").addEventListener("click", () => {});

inputLabel.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    changeLabelName();
  }
});

// Button change state name
// document
//   .querySelector("#btn-state-name")
//   .addEventListener("click", changeStateName);

inputState.addEventListener("keydown", (e) => {
  if (e.code === "Enter") {
    changeStateName();
  }
});

// Clear all
btnClearAll.addEventListener("click", () => {
  clearAutomata(automata);
  graph.clear();
});

// Download png
btnDownload.addEventListener("click", download);

btnChangeSim.addEventListener("change", () => {
  clearAutomata(automata);
  graph.clear();
  mode *= -1; 
});
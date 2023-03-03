// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const categories = [];

const numCategories = 6;
const numQuestionsPerCat = 5;




/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
    const ids = new Set();
    const randomJ = (await axios.get(`https://jservice.io/api/random/?count=${numCategories}`)).data;
    for (let obj of randomJ) ids.add(obj.category.id);
    return ([...ids]).length === numCategories ? [...ids] : getCategoryIds();
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catId) {
    const clues = [];
    const obj = await axios.get(`https://jservice.io/api/clues/?category=${catId}`);
    for (let i = 0; i < numQuestionsPerCat; i++) {
        // console.log(obj);  THIS IS FOR TESTING
        clues.push({question: obj.data[i].question, answer: obj.data[i].answer, showing: null});
    }
    const title = obj.data[0].category.title;
    return {title, clues};
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
    hideLoadingView();
    const $gameCont = $(".gameContainer");
    $gameCont.append(`<table><thead><tr></tr></thead><tbody></tbody></table>`);
    for (let i = 0; i < numCategories; i++) {
        $("tr").append(`<th class="${i}">${(categories[i].title).toUpperCase()}</th>`);
    }
    let val = 200;
    for (let i = 0; i < numQuestionsPerCat; i++) {
        $("tbody").append(`<tr class="row" id="r${i}"></tr>`);
        for (let j = 0; j < numCategories; j++) {
            $(`#r${i}`).append(`<td data-row="${i}" data-col="${j}" class="textHover">$${val}</td>`);
        }
        val += 200;
    }
    $("button").toggleClass("hidden").appendTo("body");
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    // Return from click event handler if anything but a TD was clicked on
    if (evt.target.tagName !== "TD") return;
    // Using the TD's data-row and data-col, get the appropriate object inside of categories array and assign to clickedCat
    const clickedCat = categories[evt.target.getAttribute("data-col")].clues[evt.target.getAttribute("data-row")];
    // Depending on clickedCat.showing value, perform certain actions
    if (clickedCat.showing === "answer") return;
    if (clickedCat.showing === null) {
        const question = cleanUpString(clickedCat.question);
        evt.target.innerText = question;
        evt.target.classList.toggle("tableText");
        clickedCat.showing = "question";
    } else {
        const answer = cleanUpString(clickedCat.answer);
        evt.target.innerText = answer;
        evt.target.classList.toggle("textHover");
        clickedCat.showing = "answer"
    }
}

function cleanUpString (string) {
    string = string.toUpperCase();
    if (string.includes("<I>")) {
        string = string.replaceAll("<I>",`"`);
        string = string.replaceAll("</I>",`"`);
    }
    return string.toUpperCase();
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
    // Delete gameboard, toggle the "loader" hidden, so that it shows up, and delete everything in "categories" array
    $(".gameContainer").empty();
    $(".loader").toggleClass("hidden");
    categories.length = 0;
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
    $(".loader").toggleClass("hidden");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
async function setupAndStart() {
    // Get array of "numCategories" # of category ids
    const ids = await getCategoryIds();
    // Get data for each category using a loop, push it to "categories" array
    try {
        for (let id of ids) categories.push(await getCategory(id));
        fillTable();
    } catch (e) {
        console.log(e);
        console.error("API sent a category without enough clues for the gameboard. Re-initalizing clues.");
        categories.length = 0;
        setupAndStart();
    }
}

/** On click of start / restart button, set up game. */
function startGame(e) {
    $("button").text("RESTART").toggleClass("hidden");
    showLoadingView();
    setupAndStart();
}

/** On page load, add event handler for clicking clues */
$( document ).ready( function() {
    // Create Title, Start Button, and Game Container, and append to body
    $("body").append(`<h1>JEOPARDY</h1><button>START</button><span class="loader hidden"></span><div class="gameContainer"></div>`);
    // Set on-click event listener to Start Button
    $("button").on("click", startGame);
    // Set on-click event listener to gameContainer to handle clicking clues
    $(".gameContainer").on("click", handleClick);
})

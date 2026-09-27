const schedule = {

    Monday: 7,

    Tuesday: 3,

    Wednesday: 5,

    Thursday: 5,

    Friday: 3,

    Saturday: 4

};


const STORAGE_KEY =
    "collegeAttendanceData";


let data = {

    records: {},

    target: 75

};


// =============================
// SERVICE WORKER
// =============================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker.register(
                "./service-worker.js"
            )

            .then(function () {

                console.log(
                    "Service worker registered."
                );

            })

            .catch(function (error) {

                console.log(
                    "Service worker registration failed:",
                    error
                );

            });

        }
    );

}


// =============================
// DATE HELPERS
// =============================

function getToday() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDayName(dateString) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long"
        }
    );
}


// =============================
// LOAD DATA
// =============================

function loadData() {

    const savedData =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!savedData) {
        return;
    }


    try {

        const parsedData =
            JSON.parse(savedData);


        if (
            parsedData.records &&
            typeof parsedData.records === "object"
        ) {

            data.records =
                parsedData.records;
        }


        if (
            typeof parsedData.target ===
            "number"
        ) {

            data.target =
                parsedData.target;
        }


    } catch (error) {

        console.log(
            "Saved data could not be loaded."
        );
    }
}


// =============================
// SAVE DATA
// =============================

function saveData() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(data)

    );
}


// =============================
// SELECTED DATE
// =============================

function getSelectedDate() {

    return document.getElementById(
        "datePicker"
    ).value;
}


// =============================
// CURRENT RECORD
// =============================

function getCurrentRecord() {

    const date =
        getSelectedDate();


    if (!data.records[date]) {

        data.records[date] = {

            holiday: false,

            lectures: {}

        };
    }


    return data.records[date];
}


// =============================
// UPDATE DAY
// =============================

function updateDay() {

    const date =
        getSelectedDate();


    if (!date) {
        return;
    }


    const day =
        getDayName(date);


    document.getElementById(
        "selectedDay"
    ).innerText = day;


    document.getElementById(
        "attendanceTitle"
    ).innerText =
        day + " Attendance";


    updateDayStatus();

    createLectures();

    updateDayStats();

    updateOverallStats();

    updateTargetMessage();
}


// =============================
// DAY STATUS
// =============================

function updateDayStatus() {

    const date =
        getSelectedDate();


    const day =
        getDayName(date);


    const status =
        document.getElementById(
            "dayStatus"
        );


    const holidayMessage =
        document.getElementById(
            "holidayMessage"
        );


    const holidayButton =
        document.getElementById(
            "holidayButton"
        );


    // SUNDAY

    if (!schedule[day]) {

        status.innerText =
            "No Classes";


        status.className =
            "status holiday";


        holidayMessage.classList.add(
            "hidden"
        );


        holidayButton.style.display =
            "none";


        return;
    }


    holidayButton.style.display =
        "block";


    const record =
        getCurrentRecord();


    if (record.holiday) {

        status.innerText =
            "Holiday";


        status.className =
            "status holiday";


        holidayMessage.classList.remove(
            "hidden"
        );


        holidayButton.innerText =
            "Make This a Normal College Day";


    } else {

        status.innerText =
            "College Day";


        status.className =
            "status normal";


        holidayMessage.classList.add(
            "hidden"
        );


        holidayButton.innerText =
            "Mark as Holiday";
    }
}


// =============================
// CREATE LECTURES
// =============================

function createLectures() {

    const lecturesContainer =
        document.getElementById(
            "lectures"
        );


    lecturesContainer.innerHTML =
        "";


    const date =
        getSelectedDate();


    const day =
        getDayName(date);


    const record =
        getCurrentRecord();


    // SUNDAY

    if (!schedule[day]) {

        lecturesContainer.innerHTML = `

            <div class="holiday-message">

                <div class="holiday-icon">
                    ✦
                </div>

                <div>

                    <strong>
                        No Classes
                    </strong>

                    <p>
                        There are no scheduled lectures on Sunday.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    // HOLIDAY

    if (record.holiday) {

        return;
    }


    const numberOfLectures =
        schedule[day];


    for (
        let lecture = 1;
        lecture <= numberOfLectures;
        lecture++
    ) {

        const status =
            record.lectures[lecture] ||
            null;


        const lectureDiv =
            document.createElement(
                "div"
            );


        lectureDiv.className =
            "lecture";


        const name =
            document.createElement(
                "div"
            );


        name.className =
            "lecture-name";


        name.innerText =
            "Lecture " +
            lecture;


        const buttons =
            document.createElement(
                "div"
            );


        buttons.className =
            "lecture-buttons";


        const presentButton =
            document.createElement(
                "button"
            );


        presentButton.className =
            "present-button";


        presentButton.innerText =
            status === "present"
                ? "✓ Present"
                : "Present";


        if (
            status === "present"
        ) {

            presentButton.classList.add(
                "selected-present"
            );
        }


        presentButton.onclick =
            function () {

                markAttendance(
                    lecture,
                    "present"
                );

            };


        const absentButton =
            document.createElement(
                "button"
            );


        absentButton.className =
            "absent-button";


        absentButton.innerText =
            status === "absent"
                ? "✕ Absent"
                : "Absent";


        if (
            status === "absent"
        ) {

            absentButton.classList.add(
                "selected-absent"
            );
        }


        absentButton.onclick =
            function () {

                markAttendance(
                    lecture,
                    "absent"
                );

            };


        buttons.appendChild(
            presentButton
        );


        buttons.appendChild(
            absentButton
        );


        lectureDiv.appendChild(
            name
        );


        lectureDiv.appendChild(
            buttons
        );


        lecturesContainer.appendChild(
            lectureDiv
        );
    }
}


// =============================
// MARK ATTENDANCE
// =============================

function markAttendance(
    lecture,
    status
) {

    const record =
        getCurrentRecord();


    if (record.holiday) {
        return;
    }


    record.lectures[lecture] =
        status;


    saveData();


    updateDay();
}


// =============================
// DAY STATISTICS
// =============================

function getDayStats() {

    const record =
        getCurrentRecord();


    let total = 0;

    let present = 0;

    let absent = 0;


    if (record.holiday) {

        return {

            total: 0,

            present: 0,

            absent: 0,

            percentage: 0

        };
    }


    for (
        const lecture in record.lectures
    ) {

        const status =
            record.lectures[lecture];


        if (
            status === "present"
        ) {

            total++;

            present++;

        } else if (
            status === "absent"
        ) {

            total++;

            absent++;
        }
    }


    const percentage =
        total === 0
            ? 0
            : (present / total) * 100;


    return {

        total,

        present,

        absent,

        percentage

    };
}


// =============================
// UPDATE DAY STATISTICS
// =============================

function updateDayStats() {

    const stats =
        getDayStats();


    document.getElementById(
        "dayTotal"
    ).innerText =
        stats.total;


    document.getElementById(
        "dayPresent"
    ).innerText =
        stats.present;


    document.getElementById(
        "dayPercentage"
    ).innerText =
        stats.percentage.toFixed(1)
        + "%";
}


// =============================
// OVERALL STATISTICS
// =============================

function getOverallStats() {

    let total = 0;

    let present = 0;

    let absent = 0;


    for (
        const date in data.records
    ) {

        const record =
            data.records[date];


        if (record.holiday) {
            continue;
        }


        for (
            const lecture in record.lectures
        ) {

            const status =
                record.lectures[lecture];


            if (
                status === "present"
            ) {

                total++;

                present++;

            } else if (
                status === "absent"
            ) {

                total++;

                absent++;
            }
        }
    }


    const percentage =
        total === 0
            ? 0
            : (present / total) * 100;


    return {

        total,

        present,

        absent,

        percentage

    };
}


// =============================
// UPDATE OVERALL
// =============================

function updateOverallStats() {

    const stats =
        getOverallStats();


    const percentage =
        stats.percentage.toFixed(1)
        + "%";


    document.getElementById(
        "overallTotal"
    ).innerText =
        stats.total;


    document.getElementById(
        "overallPresent"
    ).innerText =
        stats.present;


    document.getElementById(
        "overallAbsent"
    ).innerText =
        stats.absent;


    document.getElementById(
        "overallPercentage"
    ).innerText =
        percentage;


    document.getElementById(
        "ringPercentage"
    ).innerText =
        percentage;


    const progress =
        Math.min(
            stats.percentage,
            100
        );


    document.getElementById(
        "targetProgress"
    ).style.width =
        progress + "%";
}


// =============================
// TARGET MESSAGE
// =============================

function updateTargetMessage() {

    const stats =
        getOverallStats();


    const target =
        Number(data.target);


    const message =
        document.getElementById(
            "targetMessage"
        );


    if (stats.total === 0) {

        message.innerText =
            `Your attendance target is ${target}%. Start marking your lectures.`;

        return;
    }


    if (
        stats.percentage >= target
    ) {

        let possibleAbsences = 0;


        if (target < 100) {

            possibleAbsences =
                Math.floor(

                    (
                        stats.present /
                        (target / 100)
                    )
                    -
                    stats.total

                );
        }


        message.innerText =
            `You are above your ${target}% target. ` +
            `You can miss approximately ` +
            `${Math.max(
                0,
                possibleAbsences
            )} more lecture(s) while staying at or above your target.`;

        return;
    }


    if (target === 100) {

        message.innerText =
            `You cannot reach 100% without correcting or removing previous absence records.`;

        return;
    }


    const requiredPresent =
        Math.ceil(

            (

                (target / 100) *
                stats.total
                -
                stats.present

            )
            /
            (1 - target / 100)

        );


    message.innerText =
        `You are below your ${target}% target. ` +
        `You need to attend the next ` +
        `${Math.max(
            0,
            requiredPresent
        )} lecture(s) in a row to reach the target.`;
}


// =============================
// TARGET INPUT
// =============================

function setupTargetInput() {

    const input =
        document.getElementById(
            "targetInput"
        );


    input.value =
        data.target;


    input.addEventListener(
        "change",
        function () {

            let value =
                Number(input.value);


            if (
                !Number.isFinite(value)
            ) {

                value = 75;
            }


            value =
                Math.max(
                    1,
                    Math.min(
                        100,
                        value
                    )
                );


            data.target =
                value;


            input.value =
                value;


            saveData();


            updateTargetMessage();

        }
    );
}


// =============================
// HOLIDAY
// =============================

function toggleHoliday() {

    const date =
        getSelectedDate();


    const day =
        getDayName(date);


    if (!schedule[day]) {
        return;
    }


    const record =
        getCurrentRecord();


    if (record.holiday) {

        record.holiday =
            false;

    } else {

        record.holiday =
            true;


        record.lectures =
            {};
    }


    saveData();


    updateDay();
}


// =============================
// GO TO DAY
// =============================

function goToDay(dayName) {

    const selectedDate =
        getSelectedDate();


    const currentDate =
        new Date(
            selectedDate +
            "T00:00:00"
        );


    const currentDay =
        currentDate.getDay();


    const mondayOffset =
        currentDay === 0
            ? -6
            : 1 - currentDay;


    const monday =
        new Date(
            currentDate
        );


    monday.setDate(

        currentDate.getDate()
        +
        mondayOffset

    );


    const dayNumbers = {

        Monday: 0,

        Tuesday: 1,

        Wednesday: 2,

        Thursday: 3,

        Friday: 4,

        Saturday: 5

    };


    monday.setDate(

        monday.getDate()
        +
        dayNumbers[dayName]

    );


    const year =
        monday.getFullYear();


    const month =
        String(
            monday.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            monday.getDate()
        ).padStart(2, "0");


    document.getElementById(
        "datePicker"
    ).value =
        `${year}-${month}-${day}`;


    updateDay();
}


// =============================
// RESET
// =============================

function resetAllData() {

    const confirmed =
        confirm(
            "Are you sure you want to delete all attendance data?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    data = {

        records: {},

        target: 75

    };


    document.getElementById(
        "targetInput"
    ).value = 75;


    updateDay();


    alert(
        "All attendance data has been reset."
    );
}


// =============================
// START APP
// =============================

function startApp() {

    loadData();


    const datePicker =
        document.getElementById(
            "datePicker"
        );


    datePicker.value =
        getToday();


    datePicker.addEventListener(
        "change",
        updateDay
    );


    setupTargetInput();


    updateDay();
}


startApp();
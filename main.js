function log() {
    var debug = false;
    if (debug) {
        var args = $.makeArray(arguments);
        args.unshift("[DEBUG]");
        console.log.apply(console, args);
    }
}

function error() {
    var args = $.makeArray(arguments);
    args.unshift("[ERROR]");
    console.error.apply(console, args);
}

var codeCheckerConfig = {
    // Get config from backend:
    baseUrl: "",
    productId: "",
    productName: "",
    productDescription: "",

    getUrl: function() {
        return this.baseUrl + "/" + this.productId;
    }
};

const TOTAL = "TOTAL";
var summaryTable = {
    selected: false,
    component: false
};

var summaryData = {
};

function addSummaryData(component, data) {
    summaryData[component] = data;
}

function getSummaryData(component) {
    return summaryData[component];
}

function removeSummaryData() {
    for (const key in summaryData)
        delete summaryData[key];
}

function formateDate(date, delimiter = ".") {
    return [
        date.getFullYear(),
        ('0' + (date.getMonth() + 1)).slice(-2),
        ('0' + date.getDate()).slice(-2)
    ].join(delimiter);
}

function getText(number) {
    return number ? number : "";
}

function colorElement(element, issues, level = 3) {
    var classNegative = "negative";
    var classWarning  = "warning";
    var classPositive = "positive";
    switch (level) {
        case 0: { // Critical
            if (issues > 0)
                element.addClass(classNegative);
            break;
        }
        case 1: { // High
            if (issues == 0)
                element.addClass(classPositive);
            else if (issues < 10)
                element.addClass(classWarning);
            else
                element.addClass(classNegative);
            break;
        }
        case 2: { // Medium
            if (issues < 10)
                element.addClass(classPositive);
            else if (issues < 100)
                element.addClass(classWarning);
            else
                element.addClass(classNegative);
            break;
        }
        default: { // Low, Style, Unspecified
            if (issues > 0)
                element.addClass(classWarning);
            break;
        }
    }
}

function enableLoader() {
    $("#loading").removeClass("disabled");
    $("#loading").addClass("active");
}

function disableLoader() {
    $("#loading").removeClass("active");
    $("#loading").addClass("disabled");
}

function onLoad() {
    log("onLoad()", "requesting data...");

    // // "Dark" theme
    // $("div,table").addClass("inverted");

    // Enable tablesort.js
    $("table").tablesort();

    enableLoader();
    requestConfig();
}

function requestConfig() {
    log("requestConfig()", "requesting config...");
    $.ajax({url: "api/index.php?query=config", success: function(result) {
        log("requestConfig()", "data received");
        onConfig(result);
        requestTotal();
    }});
}

function requestTotal() {
    log("requestTotal()", "requesting data...");
    $.ajax({url: "api/index.php?query=total", success: function(result) {
        log("requestTotal()", "data received");
        onTotal(result);
        requestComponents();
    }});
}

function requestComponents() {
    log("requestComponents()", "requesting data...");
    $.ajax({url: "api/index.php?query=components", success: function(result) {
        log("requestComponents()", "data received");
        onComponents(result);
    }});
}

function requestSummaryForComponent(component) {
    log("requestSummaryForComponent()", "requesting data...");
    $.ajax({url: "api/index.php?query=summary&component=" + component, success: function(result) {
        log("requestSummaryForComponent()", "data received");
        onSummary(result, component);
    }});
}

function requestDataForChart(days = 60) {
    log("requestDataForChart()", "requesting data...");
    drawChart();
    var now = new Date();
    for (var d = 0; d < days; d++) {
    // for (var d = days; d >= 0; d--) {
        var date = new Date();
        date.setDate(now.getDate() - d);
        log("Date:", formateDate(date, ":"));
        requestSummaryForDate(date);
    }
}

function requestSummaryForDate(date) {
    log("requestSummaryForDate()", "requesting data for " + date);
    var requestDate = formateDate(date, ":");
    $.ajax({url: "api/index.php?query=summary&date=" + requestDate, success: function(result) {
        log("requestSummaryForDate()", "data received for " + date);
        onDataForChart(date, result);
    }});
}

function onConfig(result) {
    try {
        log("onConfig()", "result=", result);
        var data = JSON.parse(result);
        log("onConfig()", "data=", data);
        codeCheckerConfig.baseUrl = data.codeCheckerDataBaseUrl;
        codeCheckerConfig.productId = data.productId;
        codeCheckerConfig.productName = data.productName;
        codeCheckerConfig.productDescription = data.productDescription;
        $("#product").text(codeCheckerConfig.productName);
        log("onConfig()", "codeCheckerConfig=", codeCheckerConfig);
    } catch(e) {
        error(e);
    }
}

function onTotal(result) {
    try {
        log("onTotal()", "result=", result);
        var data = JSON.parse(result);
        log("onTotal()", "data=", data);

        removeSummaryData();
        addSummaryData(TOTAL, data);

        issues = processSummary(data);
        displayTotal(issues);
        displayCheckers(data);
    } catch(e) {
        error(e);
    }
}

function onSummary(result, component) {
    try {
        log("onSummary()", "result=", result);
        var data = JSON.parse(result);
        log("onSummary()", "data=", data);

        addSummaryData(component, data);

        issues = processSummary(data);
        addSummaryRow(issues, component);
    } catch(e) {
        error(e);
    }
}

function onComponents(result) {
    try {
        log("onComponents()", "result=", result);
        var data = JSON.parse(result);
        log("onComponents()", "data=", data);
        for (const component of data) {
            log("onComponents()", "component=", component);
            requestSummaryForComponent(component["name"]);
        }
        requestDataForChart();
    } catch(e) {
        error(e);
    }
}

function processSummary(data) {
    log("processSummary()");
    var issues = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "STYLE": 0,
        "UNSPECIFIED": 0,
    };
    for (const checker of data) {
        issues[checker["severity"]] += checker["reports"];
    }
    log("processSummary()", "issues=", issues);
    return issues;
}

function displayTotal(issues) {
    $("#summary").empty();
    disableLoader();
    addSummaryRow(issues);
}

function addSummaryRow(issues, component = TOTAL) {
    log("addSummaryRow()", "issues=", issues);

    var url = codeCheckerConfig.getUrl() + "/reports?is-unique=on&detection-status=Unresolved";
    if (component != TOTAL)
        url += "&source-component=" + component;

    var external = $("<i>").addClass("small external alternate icon");
    var name = $("<td>").append(
        $("<a>", {
            text: component,
            title: "Open CodeChecker online database in new window",
            href: url,
            target: "_blank",
        }).prepend(external)
    );
    // var name = $("<td>").text(component);
    var critical = $("<td>").text(getText(issues["CRITICAL"]));
    var high = $("<td>").text(getText(issues["HIGH"]));
    var medium = $("<td>").text(getText(issues["MEDIUM"]));
    var low = $("<td>").text(getText(issues["LOW"]));
    var style = $("<td>").text(getText(issues["STYLE"]));
    var unspecified = $("<td>").text(getText(issues["UNSPECIFIED"]));

    if (component == TOTAL) {
        var emphasize = "ui medium header";
        name.addClass(emphasize);
        critical.addClass(emphasize);
        high.addClass(emphasize);
        medium.addClass(emphasize);
        low.addClass(emphasize);
        style.addClass(emphasize);
        unspecified.addClass(emphasize);
    }

    colorElement(critical, issues["CRITICAL"], 0);
    colorElement(high, issues["HIGH"], 1);
    colorElement(medium, issues["MEDIUM"], 2);
    colorElement(low, issues["LOW"]);
    colorElement(style, issues["STYLE"]);
    colorElement(unspecified, issues["UNSPECIFIED"]);

    var row = $("<tr>").append(
            name, critical, high, medium, low, style, unspecified
    ).click(function() {
            var data = getSummaryData(component);
            selectSummaryRow($(this), component);
            displayCheckers(data);
    })
    $("#summary").append(row);
    if (component == TOTAL)
        selectSummaryRow(row);
}

function selectSummaryRow(row, component = false) {
    if (summaryTable.selected == row)
        return;
    if (summaryTable.selected)
        summaryTable.selected.removeClass("active");
    row.addClass("active");
    summaryTable.selected = row;
    if (component != TOTAL)
        summaryTable.component = component;
    else
        summaryTable.component = false;
}

function displayCheckers(data) {
    $("#checkers").empty();

    var severityName = {
        CRITICAL: "Critical",
        HIGH: "High",
        MEDIUM: "Medium",
        LOW: "Low",
        STYLE: "Style",
        UNSPECIFIED: "Unspecified"
    }

    var url = codeCheckerConfig.getUrl() + "/reports?is-unique=on&detection-status=Unresolved";
    if (summaryTable.component)
        url += "&source-component=" + summaryTable.component;
    url += "&checker-name=";

    for (const item of data) {
        var external = $("<i>").addClass("small external alternate icon");
        var checker = $("<td>").append(
            $("<a>", {
                text: item["checker"],
                title: "Open CodeChecker online database in new window",
                href: url + item["checker"],
                target: "_blank",
            }).prepend(external)
        );
        // var checker = $("<td>").text(item["checker"]);
        var severity = $("<td>").text(severityName[item["severity"]]);
        var unreviewed = $("<td>").text(getText(item["unreviewed"]));
        var confirmed = $("<td>").text(getText(item["confirmed"]));
        var falsePositives = $("<td>").text(getText(item["false_positive"]));
        var intentional = $("<td>").text(getText(item["intentional"]));
        var total = $("<td>").text(getText(item["reports"]));

        switch (item["severity"]) {
            case "HIGH": {
                checker.addClass("error");
                severity.addClass("error");
                colorElement(unreviewed, item["unreviewed"], 1);
                break;
            }
            case "MEDIUM": {
                checker.addClass("warning");
                severity.addClass("warning");
                colorElement(unreviewed, item["unreviewed"], 2);
                break;
            }
            default: {
                colorElement(unreviewed, item["unreviewed"]);
            }
        }
        // colorElement(confirmed, item["confirmed"]);
        // colorElement(falsePositives, item["false_positive"]);
        // colorElement(intentional, item["intentional"]);

        $("#checkers").append(
            $("<tr>").append(
                checker, severity, unreviewed, confirmed, falsePositives, intentional, total
            )
        );
    }
}

var chartObject = false;
var chartConfig = false;
var chartData = new Array();
var chartTime = new Array();

function onDataForChart(date, result) {
    try {
        log("onDataForChart()", "result=", result);
        var data = JSON.parse(result);
        log("onDataForChart()", "data=", data);
        issues = processSummary(data);
        log("onDataForChart()", "date=", date, "issues=", issues);

        chartData[date.getTime()] = issues;
        chartTime.push(date.getTime());
        chartTime.sort();

        chartConfig.data.labels = new Array();
        chartConfig.data.datasets[0].data = new Array();
        chartConfig.data.datasets[1].data = new Array();
        chartConfig.data.datasets[2].data = new Array();
        for (const time of chartTime) {
            var datetime = new Date(Number(time));
            chartConfig.data.labels.push(formateDate(datetime));
            chartConfig.data.datasets[0].data.push(chartData[time]["HIGH"]);
            chartConfig.data.datasets[1].data.push(chartData[time]["MEDIUM"]);
            chartConfig.data.datasets[2].data.push(chartData[time]["LOW"]);
        }
        chartObject.update();

    } catch(e) {
        error(e);
    }
}

function drawChart() {
    try {
        var ctx = $("#chart").get(0).getContext("2d");
    } catch(e) {
        error(e);
    }

    chartConfig = {
        // The type of chart we want to create
        type: "line",
        // The data for our dataset
        data: {
            labels: [],
            datasets: [{
                label: "High",
                backgroundColor: "rgba(255, 168, 0, 0.8)",
                fill: true,
                borderColor: "rgb(255, 68, 0)",
                cubicInterpolationMode: "monotone",
                borderWidth: 2,
                pointRadius: 1,
                order: 1,
                data: [0],
                type: "line"
            },{
                label: "Medium",
                backgroundColor: "rgba(255, 255, 0, 0.3)",  // "rgba(69, 211, 135, 0.3)",
                fill: true,
                borderColor: "rgb(150, 150, 0)",  // "rgb(69, 211, 135)",
                cubicInterpolationMode: "monotone",
                borderWidth: 2,
                pointRadius: 1,
                order: 2,
                data: [0],
                type: "line"
            }, {
                label: "Low",
                backgroundColor: "rgba(102, 150, 3, 0.3)",
                fill: true,
                borderColor: "rgb(102, 150, 3)",
                cubicInterpolationMode: "monotone",
                borderWidth: 2,
                pointRadius: 1,
                order: 0,
                data: [0],
                type: "line"
            }]
        },
        // Configuration options go here
        options: {
            title: {
                text: "Defects in time"
            },
            scales: {
                xAxes: [{
                }],
                yAxes: [{
                    ticks: {
                        min: 0,
                    }
                }]
            },
            tooltips: {
                mode: "index"
            }
        }
    }

    chartObject = new Chart(ctx, chartConfig);
}

$(function() {
    log("$(function(){})");
    onLoad();
});

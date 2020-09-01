function log() {
    var debug = false;
    if (debug) {
        var args = $.makeArray(arguments);
        args.unshift("[DEBUG]");
        console.log.apply(console, args);
    }
}

function error() {
    console.error.apply(console, arguments);
    window.stop();

    if (typeof showError === "undefined") {
        showError = true;
        var details = "";
        for (const arg of arguments)
            details += arg + "\n";
        $("#error-text").text(arguments[0]);
        $("#error-details").text(details);
        $("#error").modal("show");
    }
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

const TOTAL = "__TOTAL__";
const RECENT = "__RECENT__";

var summaryTable = {
    selected: false,
    component: false,
    detected: false
};

var summaryData = {
    get: function(component) {
        return this.data[component];
    },
    add: function(component, data) {
        this.data[component] = data;
    },
    getMeta: function(component) {
        if (this.meta)
            return this.meta[component];
        else
            return false;
    },
    addMeta: function(meta) {
        this.meta = meta;
    },
    remove: function() {
        this.data = {};
    },
    data: {},
    meta: false
};

function formateDate(date, delimiter = ".") {
    return [
        date.getFullYear(),
        ('0' + (date.getMonth() + 1)).slice(-2),
        ('0' + date.getDate()).slice(-2)
    ].join(delimiter);
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
    try {
        log("onLoad()", "requesting data...");

        // // "Dark" theme
        // $("div,table").addClass("inverted");

        // Enable tablesort.js
        $("table").tablesort();
        // Enable accordions
        $(".ui.accordion").accordion();
        // Display "Loading..." sign
        enableLoader();
        // Request project configuration
        requestConfig();
        // Reload page every 30 minutes of idle
        reloadOnIdle(30);
    } catch(e) {
        error("Unknown exception", e);
    }
}

function reloadOnIdle(minutes) {
    var timer = null;
    var timeout = minutes * 60 * 1000;

    function setTimer() {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(function() {
            timer = null;
            location.reload(true);
        }, timeout);
    }

    $(document).bind("click keyup mousemove", setTimer);
    setTimer();
}

function sendRequest(query, handler) {
    log("sendRequest()");
    $.ajax({
        url: "api/index.php?" + query,
        success: handler,
        error: function (request, status, message) {
            error("Request error", "URL: " + this.url, "Status code: " + request.status, "Error message: " + message);
        }
    });
}

function requestConfig() {
    log("requestConfig()", "requesting config...");
    sendRequest("query=config", function(result) {
        log("requestConfig()", "data received");
        onConfig(result);
        requestTotal();
    });
}

function requestTotal() {
    log("requestTotal()", "requesting data...");
    sendRequest("query=total", function(result) {
        log("requestTotal()", "data received");
        onTotal(result);
        requestComponents();
    });
}

function requestComponents() {
    log("requestComponents()", "requesting data...");
    sendRequest("query=components", function(result) {
        log("requestComponents()", "data received");
        onComponents(result);
    });
}

function requestSummaryForComponent(component) {
    log("requestSummaryForComponent()", "requesting data...");
    sendRequest("query=summary&component=" + component, function(result) {
        log("requestSummaryForComponent()", "data received");
        onSummary(result, component);
    });
}

function requestDataForChart(days = 60) {
    log("requestDataForChart()", "requesting data...");
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
    sendRequest("query=summary&date=" + requestDate, function(result) {
        log("requestSummaryForDate()", "data received for " + date);
        onDataForChart(date, result);
    });
}

function requestRecent(days, handler) {
    log("requestRecent()", "requesting data recent days " + days);
    var now = new Date();
    var date = new Date();
    date.setDate(now.getDate() - days);
    var requestDate = formateDate(date, ":");
    var detectedDate = formateDate(date, "-");
    sendRequest("query=recent&date=" + requestDate, function(result) {
        log("requestRecent()", "data received after " + date);
        handler(result, detectedDate);
    });
}

function onConfig(result) {
    try {
        log("onConfig()", "result=", result);
        var data = JSON.parse(result);
        log("onConfig()", "data=", data);
        for (const prop of ["codeCheckerDataBaseUrl", "productId", "productName"]) {
            if (!(prop in data))
                throw "Wrong config data: " + prop + " is missing";
        }
        codeCheckerConfig.baseUrl = data.codeCheckerDataBaseUrl;
        codeCheckerConfig.productId = data.productId;
        codeCheckerConfig.productName = data.productName;
        codeCheckerConfig.productDescription = data.productDescription;
        log("onConfig()", "codeCheckerConfig=", codeCheckerConfig);

        $("#product-name").text(codeCheckerConfig.productName);
        $("#product-description").text(codeCheckerConfig.productDescription);
    } catch(e) {
        error("Failed to configure CodeChecker", e, "Request result:", result);
    }
}

function onTotal(result) {
    try {
        log("onTotal()", "result=", result);
        var data = JSON.parse(result);
        log("onTotal()", "data=", data);

        summaryData.remove();
        summaryData.add(TOTAL, data);

        issues = processSummary(data);
        displayTotal(issues);
        displayCheckers(data);

        // Request recently detected defects
        requestRecent(1, onLastDay);
    } catch(e) {
        error("Failed to process data for TOTAL", e, "Request result:", result);
    }
}

function onSummary(result, component) {
    try {
        log("onSummary()", "result=", result);
        var data = JSON.parse(result);
        log("onSummary()", "data=", data);

        summaryData.add(component, data);

        issues = processSummary(data);
        addSummaryRow(issues, component);
    } catch(e) {
        error("Failed to process Summary data", e, "Component", component, "Request result:", result);
    }
}

function onComponents(result) {
    try {
        log("onComponents()", "result=", result);
        var data = JSON.parse(result);
        log("onComponents()", "data=", data);
        var meta = {};
        for (const component of data) {
            log("onComponents()", "component=", component);
            requestSummaryForComponent(component["name"]);
            meta[component["name"]] = component;
        }
        summaryData.addMeta(meta);
        requestDataForChart();
    } catch(e) {
        error("Failed to process Components", e, "Request result:", result);
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

    // Workaround for "sort table disables popup" bug
    $("thead").click(function() {
        setTimeout(function() {
            $("td.popper").popup();
        }, 100);
    });
}

function createNumberCell(number) {
    var text = number ? number : "";
    var cell = $("<td>").text(text);
    cell.attr("data-sort-value", number);  // need for tablesort.js
    return cell;
}

function addSummaryRow(issues, component = TOTAL) {
    log("addSummaryRow()", "issues=", issues);

    var title = component;
    var url = codeCheckerConfig.getUrl() + "/reports?is-unique=on&detection-status=Unresolved";
    var popup = false;
    if (component == TOTAL) {
        title = "TOTAL";
    } else {
        url += "&source-component=" + component;
        var meta = summaryData.getMeta(component);
        popup = meta["description"] + " (" + meta["value"] + ")";
    }

    var external = $("<i>").addClass("small external alternate icon");
    var name = $("<td>").append(
        $("<a>", {
            text: title,
            title: "Open CodeChecker online database in new window",
            href: url,
            target: "_blank",
        }).prepend(external)
    );
    if (popup) {
        name.addClass("popper");
        name.attr("data-content", popup);
        name.attr("data-position", "bottom left")
    }
    var critical = createNumberCell(issues["CRITICAL"]);
    var high = createNumberCell(issues["HIGH"]);
    var medium = createNumberCell(issues["MEDIUM"]);
    var low = createNumberCell(issues["LOW"]);
    var style = createNumberCell(issues["STYLE"]);
    var unspecified = createNumberCell(issues["UNSPECIFIED"]);

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
            var data = summaryData.get(component);
            selectSummaryRow($(this), component);
            displayCheckers(data);
    })
    $("#summary").append(row);
    $("td.popper").popup();
    if (component == TOTAL)
        selectSummaryRow(row);
}

function selectSummaryRow(row, component = false, detected = false) {
    if (summaryTable.selected == row)
        return;
    if (summaryTable.selected)
        summaryTable.selected.removeClass("active");
    row.addClass("active");
    summaryTable.selected = row;
    if (component != TOTAL && component != RECENT)
        summaryTable.component = component;
    else
        summaryTable.component = false;
    summaryTable.detected = detected;
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
    if (summaryTable.detected)
        url += "&first-detection-date=" + summaryTable.detected; // 2020-09-01
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
        var unreviewed = createNumberCell(item["unreviewed"]);
        var confirmed = createNumberCell(item["confirmed"]);
        var falsePositives = createNumberCell(item["false_positive"]);
        var intentional = createNumberCell(item["intentional"]);
        var total = createNumberCell(item["reports"]);

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

function onLastDay(result, detected) {
    if (!onRecentlyDetected(result, "Detected within the last day:", detected, "red"))
        requestRecent(7, onLastWeek);
}

function onLastWeek(result, detected) {
    if (!onRecentlyDetected(result, "Detected within the last week:", detected, "orange"))
        requestRecent(10, onLastTenDays);
}

function onLastTenDays(result, detected) {
    if (!onRecentlyDetected(result, "Detected within the last 10 days:", detected, "orange"))
        requestRecent(15, onLastTwoWeek);
}

function onLastTwoWeek(result, detected) {
    if (!onRecentlyDetected(result, "Detected within the last two weeks:", detected))
        requestRecent(30, onLastMonth);
}

function onLastMonth(result) {
    onRecentlyDetected(result, "Detected within the last month:");
}

function onRecentlyDetected(result, title, detected, style = "") {
    try {
        log("onRecentlyDetected()", "result=", result);
        var data = JSON.parse(result);
        log("onRecentlyDetected()", "data=", data);
        summaryData.add(RECENT, data);
        issues = processSummary(data);
        log("onRecentlyDetected()", "issues=", issues);

        function addLabel(element, issues, color, popup) {
            if (issues > 0) {
                element.append(
                    $("<div>")
                        .addClass("ui circular label " + color)
                        .text(issues)
                        .attr("data-content", popup)
                        .attr("data-position", "bottom right")
                );
            }
        }

        var total = 0;
        for (const item in issues)
            total += issues[item];

        if (total > 0) {
            title += " " + total + " ";
            var element = $("<div>").text(title).addClass("ui right floated basic button " + style);
            addLabel(element, issues["CRITICAL"], "red", "Critical defects");
            addLabel(element, issues["HIGH"], "orange", "High severity defects");
            addLabel(element, issues["MEDIUM"], "yellow", "Medium severity defects");
            addLabel(element, issues["LOW"], "olive", "Low severity defects");
            addLabel(element, issues["STYLE"], "purple", "Style defects");
            addLabel(element, issues["UNSPECIFIED"], "grey", "Unspecified defects");
            element.click(function() {
                var checkers = summaryData.get(RECENT);
                selectSummaryRow(element, RECENT, detected);
                displayCheckers(checkers);
            });
            element.insertAfter("#product-name");
            $(".ui.label").popup();
        }
        return total;
    } catch(e) {
        error("Failed to process recent data", e, "Title: " + title, "Request result:", result);
    }
}

function onDataForChart(date, result) {
    try {
        log("onDataForChart()", "result=", result);
        var data = JSON.parse(result);
        log("onDataForChart()", "data=", data);
        issues = processSummary(data);
        log("onDataForChart()", "date=", date, "issues=", issues);
        timeLineChart.draw(date, issues);
    } catch(e) {
        error("Failed to process data for Chart", e, "Date:", date, "Request result:", result);
    }
}

var timeLineChart = {
    // Public:
    draw: function(date, issues) {
        try {
            log("timeLineChart.draw()", "date=", date, "issues=", issues);
            this.chartData[date.getTime()] = issues;
            this.chartTime.push(date.getTime());
            this.chartTime.sort();

            this.chartConfig.data.labels = new Array();
            this.chartConfig.data.datasets[0].data = new Array();
            this.chartConfig.data.datasets[1].data = new Array();
            this.chartConfig.data.datasets[2].data = new Array();
            for (const time of this.chartTime) {
                var datetime = new Date(Number(time));
                this.chartConfig.data.labels.push(formateDate(datetime));
                this.chartConfig.data.datasets[0].data.push(this.chartData[time]["HIGH"]);
                this.chartConfig.data.datasets[1].data.push(this.chartData[time]["MEDIUM"]);
                this.chartConfig.data.datasets[2].data.push(this.chartData[time]["LOW"]);
            }
            this.updateChart();
        } catch(e) {
            error("Failed to update Chart", e, "Date:", date, "Chart data:", issues);
        }
    },
    // Protected:
    updateChart: function() {
        if (!this.chartObject)
            this.createChart();
        this.chartObject.update();
    },
    createChart: function() {
        try {
            var ctx = $("#chart").get(0).getContext("2d");
            this.chartObject = new Chart(ctx, this.chartConfig);
        } catch(e) {
            error("Failed to create Chart", e);
        }
    },
    chartObject: false,
    chartData: new Array(),
    chartTime: new Array(),
    chartConfig: {
        // The type of chart we want to create
        type: "line",
        // The data for our dataset
        data: {
            labels: [],
            datasets: [{
                label: "High",
                backgroundColor: "rgba(242, 113, 28, 0.7)",
                fill: true,
                borderColor: "rgb(242, 113, 28)",
                cubicInterpolationMode: "monotone",
                borderWidth: 2,
                pointRadius: 1,
                order: 1,
                data: [0],
                type: "line"
            },{
                label: "Medium",
                backgroundColor: "rgba(251, 189, 8, 0.3)",
                fill: true,
                borderColor: "rgb(251, 189, 8)",
                cubicInterpolationMode: "monotone",
                borderWidth: 2,
                pointRadius: 1,
                order: 2,
                data: [0],
                type: "line"
            }, {
                label: "Low",
                backgroundColor: "rgba(181, 204, 24, 0.3)",
                fill: true,
                borderColor: "rgb(181, 204, 24)",
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
}

$(function() {
    log("$(function(){})");
    onLoad();
});

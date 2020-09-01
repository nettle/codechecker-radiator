function debug_log() {
    if (page.debug) {
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
        debug_log("onLoad()");

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
    debug_log("sendRequest()", query);
    $.ajax({
        url: "api/index.php?" + query,
        success: handler,
        error: function (request, status, message) {
            error("Request error", "URL: " + this.url, "Status code: " + request.status, "Error message: " + message);
        }
    });
}

function requestConfig() {
    sendRequest("query=config", function(result) {
        onConfig(result);
        // requestProduct();
        requestTotal();
    });
}

function requestProduct() {
    sendRequest("query=product", function(result) {
        debug_log(result);
        var data = JSON.parse(result);
        var title = data["displayedName_b64"];
        var description = data["description_b64"];
        title = atob(title);
        description = atob(description);
        debug_log("title=", title, "description=", description);
        $("#product-name").text(title);
        $("#product-description").text(description);
        // Product ifo structure:
        // data["endpoint"] == "PD_BBI"
        // data["connected"] == true
        // data["accessible"] == true
        // data["administrating"] == true
        // data["databaseStatus"] == 0
        // data["runCount"] = 31
        // data["latestStoreToProduct"] = "2020-09-01 14:18:53.615597"
        // data["runLimit"] == null
        // data["runStoreInProgress"] == []
    });
}

function requestTotal() {
    sendRequest("query=total", function(result) {
        onTotal(result);
        requestComponents();
    });
}

function requestComponents() {
    sendRequest("query=components", function(result) {
        onComponents(result);
    });
}

function requestSummaryForComponent(component) {
    sendRequest("query=summary&component=" + component, function(result) {
        onSummary(result, component);
    });
}

function requestDataForChart(days = 60) {
    var now = new Date();
    for (var d = 0; d < days; d++) {
    // for (var d = days; d >= 0; d--) {
        var date = new Date();
        date.setDate(now.getDate() - d);
        requestSummaryForDate(date);
    }
}

function requestSummaryForDate(date) {
    // NOTE: adding time as a last second of the day
    var requestDate = formateDate(date, ":") + ":23:59:59";
    sendRequest("query=summary&date=" + requestDate, function(result) {
        onDataForChart(date, result);
    });
}

function requestRecent(days, handler) {
    var now = new Date();
    var date = new Date();
    date.setDate(now.getDate() - days);
    var requestDate = formateDate(date, ":");
    var detectedDate = formateDate(date, "-");
    sendRequest("query=recent&date=" + requestDate, function(result) {
        handler(result, detectedDate);
    });
}

function onConfig(result) {
    try {
        var data = JSON.parse(result);
        for (const prop of ["codeCheckerDataBaseUrl", "productId", "productName"]) {
            if (!(prop in data))
                throw "Wrong config data: " + prop + " is missing";
        }
        codeCheckerConfig.baseUrl = data.codeCheckerDataBaseUrl;
        codeCheckerConfig.productId = data.productId;
        codeCheckerConfig.productName = data.productName;
        codeCheckerConfig.productDescription = data.productDescription;

        $("#product-name").text(codeCheckerConfig.productName);
        $("#product-description").text(codeCheckerConfig.productDescription);
    } catch(e) {
        error("Failed to configure CodeChecker", e, "Request result:", result);
    }
}

function onTotal(result) {
    try {
        var data = JSON.parse(result);

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
        var data = JSON.parse(result);
        summaryData.add(component, data);
        issues = processSummary(data);
        addSummaryRow(issues, component);
    } catch(e) {
        error("Failed to process Summary data", e, "Component", component, "Request result:", result);
    }
}

function onComponents(result) {
    try {
        var data = JSON.parse(result);
        var meta = {};
        for (const component of data) {
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

    var url = codeCheckerConfig.getUrl() + "/reports?is-unique=on";
    if (summaryTable.component)
        url += "&source-component=" + summaryTable.component;
    if (summaryTable.detected)
        url += "&first-detection-date=" + summaryTable.detected; // 2020-09-01
    else
        url += "&detection-status=New&detection-status=Unresolved&detection-status=Reopened";

    for (const item of data) {
        var external = $("<i>").addClass("small external alternate icon");
        var checker = $("<td>").append(
            $("<a>", {
                text: item["checker"],
                title: "Open CodeChecker online database in new window",
                href: url + "&checker-name=" + item["checker"],
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
        var data = JSON.parse(result);
        summaryData.add(RECENT, data);
        issues = processSummary(data);

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
        var data = JSON.parse(result);
        issues = processSummary(data);
        timeLineChart.draw(date, issues);
    } catch(e) {
        error("Failed to process data for Chart", e, "Date:", date, "Request result:", result);
    }
}

var page = {
    debug: false,
    init: function() {
        var query = new URLSearchParams(window.location.search);
        this.debug = query.has("debug");
    }
}

$(function() {
    page.init();
    onLoad();
});

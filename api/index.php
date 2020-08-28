<?php

require_once("codechecker.php");

function debug_log($message)
{
    $debug = false;
    if ($debug)
    {
        $datearray = explode(" ", microtime());
        $timestamp = date("Y-m-d H:i:s", $datearray[1]) . sprintf(".%03d", $datearray[0] * 1000);

        $log = "" . $timestamp . " [DEBUG] " . $message . "\n";
        // FIXME: how to configure path to log file?
        $logfile = realpath(dirname(__FILE__) . "/../../tmp") . "/codechecker.log";
        error_log($log, 3, $logfile);
    }
}

function debug_dump($message, $var)
{
    debug_log($message . var_export($var, true));
}

function getConfig()
{
    $config = include("config.php");
    return $config;
}

function getCodeChecker()
{
    $config = getConfig();
    return new \CodeChecker\CodeChecker(
        $config["codeCheckerDataBaseUrl"],
        $config["productId"],
        $config["codeCheckerBinPath"]);
}

function queryConfig()
{
    debug_log("queryConfig(): getting config...");
    $config = getConfig();
    $json = json_encode($config);
    echo $json;
    debug_log("queryConfig(): Done.");
}

function queryTotal()
{
    debug_log("queryTotal(): creating CodeChecker...");
    $codechecker = getCodeChecker();
    debug_log("queryTotal(): getting Summary...");
    $json = $codechecker->getSummary();
    debug_log("queryTotal(): JSON: $json");
    echo $json;
    debug_log("queryTotal(): Done.");
}

function queryComponents()
{
    debug_log("queryComponents(): creating CodeChecker...");
    $codechecker = getCodeChecker();
    debug_log("queryComponents(): getting Summary...");
    $json = $codechecker->getComponents();
    debug_log("queryComponents(): JSON: $json");
    echo $json;
    debug_log("queryComponents(): Done.");
}

function querySummary($component, $date)
{
    debug_log("querySummary(): creating CodeChecker...");
    $codechecker = getCodeChecker();
    debug_log("querySummary(): getting Summary...");
    $json = $codechecker->getSummary($component, $date);
    debug_log("querySummary(): JSON: $json");
    echo $json;
    debug_log("querySummary(): Done.");
}

function main()
{
    debug_log("===================================");
    debug_log("Start...");
    debug_log("===================================");

    $query = $_GET["query"];
    $component = $_GET["component"];
    $date = $_GET["date"];
    if (!$component)
        $component = false;
    if (!$date)
        $date = false;
    debug_log("GET: query = $query");
    debug_log("GET: component = $component");
    debug_log("GET: date = $component");
    switch($query)
    {
        case "config": return queryConfig();
        case "total": return queryTotal();
        case "components": return queryComponents();
        case "summary": return querySummary($component, $date);
        default:
            $error = "ERROR: unsupported query '$query'";
            $error .= "\nQUERY_STRING: " . $_SERVER["QUERY_STRING"];
            echo $error;
            return debug_log($error);
    }
    debug_log("Finish.\n");
}

main();

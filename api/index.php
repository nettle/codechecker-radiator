<?php

namespace CodeCheckerApi;

require_once("codechecker.php");

function error($message)
{
    $message = "ERROR: " . $message;
    echo $message;
    debug_log($message);
}

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

function querySummary($component = false, $before = false, $after = false)
{
    debug_log("querySummary(): creating CodeChecker...");
    $codechecker = getCodeChecker();
    debug_log("querySummary(): getting Summary...");
    $json = $codechecker->getSummary($component, $before, $after);
    debug_log("querySummary(): JSON: $json");
    echo $json;
    debug_log("querySummary(): Done.");
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

function queryProduct()
{
    debug_log("queryProduct(): getting config...");
    $config = getConfig();
    $id = $config["productId"];
    debug_log("queryProduct(): creating CodeChecker...");
    $codechecker = getCodeChecker();
    debug_log("queryProduct(): getting all products...");
    $json = $codechecker->getProducts();
    $products = json_decode($json, true);
    foreach ($products as $item) {
        if (array_key_exists($id, $item)) {
            $prod = $item[$id];
            $json = json_encode($prod);
            debug_log("queryProduct(): JSON: $json");
            echo $json;
            debug_log("queryProduct(): Done.");
            return;
        }
    }
    return error("Could not find product $id");
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
        case "product": return queryProduct();
        case "total": return querySummary();
        case "components": return queryComponents();
        case "summary": return querySummary($component, $date);
        case "recent": return querySummary($component, false, $date);
        default:
            $error = "ERROR: unsupported query '$query'";
            $error .= "\nQUERY_STRING: " . $_SERVER["QUERY_STRING"];
            return error($error);
    }
    debug_log("Finish.\n");
}

main();

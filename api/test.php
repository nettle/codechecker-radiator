<?php

namespace CodeChecker;

require_once("codechecker.php");

/**
 * CodeCheckerTest
 *
 * Unit test class for CodeChecker
 *
 * @see CodeChecker
 */

class CodeCheckerTest extends CodeChecker
{
    public function __construct()
    {
        parent::__construct("TEST-URL", "TEST-PRODUCT", "TEST-PATH");
    }

    public function test()
    {
        $expected = 'export PATH=$PATH:TEST-PATH/bin'
                  . ' && CodeChecker version --output=json > TEST.JSON';
        $this->check($this->getVersion(), $expected, "getVersion");

        $expected = 'export PATH=$PATH:TEST-PATH/bin'
                  . ' && CodeChecker cmd components list --url=TEST-URL/TEST-PRODUCT --output=json > TEST.JSON';
        $this->check($this->getComponents(), $expected, "getComponents");

        $expected = 'export PATH=$PATH:TEST-PATH/bin'
                  . ' && CodeChecker cmd sum --all --url=TEST-URL/TEST-PRODUCT --output=json > TEST.JSON';
        $this->check($this->getSummary(), $expected, "getSummary");
    }

    protected function execute($command)
    {
        return $this->getCommand($command, "TEST.JSON");
    }

    protected function check($result, $expected, $title)
    {
        $check = ($result == $expected) ? "PASS" : "FAIL ($result)";
        echo "<div>$title : $check</div><br/>";
    }
}

/**
 * CodeCheckerSimulator
 *
 * Simulates CodeChecker functionality
 *
 * @see CodeChecker
 */

class CodeCheckerSimulator extends CodeChecker
{
    public function __construct()
    {
        parent::__construct("TEST-URL", "TEST-PRODUCT", "TEST-PATH");
    }

    public function getVersion()
    {
        return 'CodeChecker analyzer version:' . "\n"
             . '{"Base package version": "6.12.1", "Package build date": "2020-06-12T15:49", "Git commit ID (hash)": "be4c6ac31f125be8432589ea9e9e5b1bbd838d22", "Git tag information": "6.12.1"}'  . "\n"
             . "\n"
             . 'CodeChecker web version:' . "\n"
             . '{"Base package version": "6.12.1", "Package build date": "2020-06-12T15:49", "Git commit ID (hash)": "be4c6ac31f125be8432589ea9e9e5b1bbd838d22", "Git tag information": "6.12.1", "Server supported API (Thrift)": ["6.27"], "Client API (Thrift)": "6.27"}' . "\n";
    }

    public function getComponents()
    {
        return '[ {"name": "Bait", "value": "+*/bait/*", "description": "All Bait folders"}'
             . ', {"name": "CBB", "value": "+*/cbb/*", "description": "All CBB folders"}'
             . ', {"name": "COMM", "value": "+*/comm/*", "description": "All COMM folders"}'
             . ', {"name": "EQMH", "value": "+*/eqmh/*", "description": "All EQMH folders"}'
             . ', {"name": "Hypervisor", "value": "+*/hypervisor/*", "description": "All Hypervisor folders"}'
             . ', {"name": "LPP", "value": "+*/lpp/*", "description": "All LPP folders"}'
             . ', {"name": "OBS", "value": "+*/obs/*", "description": "All OBS folders"}'
             . ']';
    }

    public function getSummary($component = false)
    {
        return '['
            . '{"checker": "bugprone-inaccurate-erase", "severity": "HIGH", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "bugprone-sizeof-expression", "severity": "HIGH", "reports": 4, "unreviewed": 4, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "core.CallAndMessage", "severity": "HIGH", "reports": 5, "unreviewed": 5, "confirmed": 0, "false_positive": 2, "intentional": 0}, '
            . '{"checker": "core.NonNullParamChecker", "severity": "HIGH", "reports": 3, "unreviewed": 3, "confirmed": 0, "false_positive": 1, "intentional": 0}, '
            . '{"checker": "core.NullDereference", "severity": "HIGH", "reports": 5, "unreviewed": 5, "confirmed": 0, "false_positive": 1, "intentional": 0}, '
            . '{"checker": "core.StackAddressEscape", "severity": "HIGH", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "core.UndefinedBinaryOperatorResult", "severity": "HIGH", "reports": 7, "unreviewed": 7, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "cplusplus.InnerPointer", "severity": "HIGH", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "cplusplus.NewDeleteLeaks", "severity": "HIGH", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "bugprone-integer-division", "severity": "MEDIUM", "reports": 2, "unreviewed": 2, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "bugprone-too-small-loop-variable", "severity": "MEDIUM", "reports": 85, "unreviewed": 85, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "cert-oop11-cpp", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-address-of-packed-member", "severity": "MEDIUM", "reports": 15, "unreviewed": 15, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-deprecated-copy", "severity": "MEDIUM", "reports": 4, "unreviewed": 4, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-format", "severity": "MEDIUM", "reports": 14, "unreviewed": 14, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-format-security", "severity": "MEDIUM", "reports": 6, "unreviewed": 6, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-implicit-int", "severity": "MEDIUM", "reports": 2, "unreviewed": 2, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-missing-field-initializers", "severity": "MEDIUM", "reports": 12, "unreviewed": 12, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-non-literal-null-conversion", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-null-dereference", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-pessimizing-move", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-range-loop-construct", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-sign-compare", "severity": "MEDIUM", "reports": 11, "unreviewed": 11, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-string-plus-int", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-tautological-overlap-compare", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-unused-const-variable", "severity": "MEDIUM", "reports": 2, "unreviewed": 2, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-unused-lambda-capture", "severity": "MEDIUM", "reports": 3, "unreviewed": 3, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-unused-parameter", "severity": "MEDIUM", "reports": 238, "unreviewed": 238, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "clang-diagnostic-varargs", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "misc-redundant-expression", "severity": "MEDIUM", "reports": 5, "unreviewed": 5, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "misc-uniqueptr-reset-release", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "optin.cplusplus.VirtualCall", "severity": "MEDIUM", "reports": 2, "unreviewed": 2, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "optin.portability.UnixAPI", "severity": "MEDIUM", "reports": 3, "unreviewed": 3, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "performance-move-constructor-init", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "performance-noexcept-move-constructor", "severity": "MEDIUM", "reports": 1, "unreviewed": 1, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "unix.Malloc", "severity": "MEDIUM", "reports": 24, "unreviewed": 24, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "unix.MallocSizeof", "severity": "MEDIUM", "reports": 3, "unreviewed": 3, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "valist.Unterminated", "severity": "MEDIUM", "reports": 2, "unreviewed": 2, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "cppcoreguidelines-special-member-functions", "severity": "LOW", "reports": 2, "unreviewed": 2, "confirmed": 0, "false_positive": 0, "intentional": 0}, '
            . '{"checker": "deadcode.DeadStores", "severity": "LOW", "reports": 17, "unreviewed": 17, "confirmed": 0, "false_positive": 0, "intentional": 0}'
            . ']';
    }
}

function test()
{
    echo "<h3>RUNNING TEST</h3><hr>";
    $codecheckertest = new CodeCheckerTest();
    $codecheckertest->test();
}

function debug()
{
    echo "<h3>RUNNING DEBUG</h3><hr>";
    $config = include("config.php");
    $codechecker = new CodeChecker(
        $config["codeCheckerDataBaseUrl"],
        $config["productId"],
        $config["codeCheckerBinPath"],
        true);
    $codechecker->getVersion();
    $codechecker->getComponents();
    $codechecker->getSummary();
}

function simulate()
{
    echo "<h3>RUNNING SIMULATION</h3><hr>";
    $codechecker = new CodeCheckerSimulator();
    echo "VERSION: <pre>" . $codechecker->getVersion() . "</pre>";
    echo "COMPONENTS: <pre>" . $codechecker->getComponents() . "</pre>";
    echo "SUMMARY: <pre>" . $codechecker->getSummary() . "</pre>";
}

function main()
{
    $test = $_GET["test"];
    switch ($test)
    {
        case "test": test(); break;
        case "debug": debug(); break;
        case "simulate": simulate(); break;
        default:
        {
            test();
            debug();
            simulate();
        }
    }
}

main();

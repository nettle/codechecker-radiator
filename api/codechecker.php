<?php

namespace CodeChecker;

/**
 * CodeChecker
 *
 * Uses CodeChecker CLI to request data from online database
 */

class CodeChecker
{
    public function __construct($server, $product, $path = false, $debug = false)
    {
        $this->serverUrl = $server;
        $this->product = $product;
        $this->path = $path;
        $this->debug = $debug;
    }

    public function getVersion()
    {
        return $this->execute("version");
    }

    public function getComponents()
    {
        $command = "cmd components list";
        $command .= " --url=" . $this->getProductUrl();
        $result = $this->execute($command);
        return $result;
    }

    public function getSummary($component = false, $before = false, $after = false)
    {
        $command = "cmd sum --all";
        if ($component) {
            $command .= " --component=\"" . $component . "\"";
        }
        if ($before) {
            $command .= " --open-reports-date=" . $before;
            $command .= " --review-status unreviewed confirmed";
            $command .= " --detection-status new reopened unresolved resolved off unavailable";
        }
        elseif ($after) {
            $command .= " --detected-after=" . $after;
        }
        $command .= " --url=" . $this->getProductUrl();
        $result = $this->execute($command);
        return $result;
    }

    public function getProducts()
    {
        $command = "cmd products list";
        $command .= " --url=" . $this->getProductUrl();
        $result = $this->execute($command);
        return $result;
    }

    protected function execute($command)
    {
        $jsonFileName = tempnam(sys_get_temp_dir(), "codechecker-result.json.");
        $command = $this->getCommand($command, $jsonFileName);
        if ($this->debug) {
            echo "Running: <b>$command</b><br>";
        }

        // $output = shell_exec($command);
        if (execute_shell_command($command, $stdout, $stderr)) {
            $output = "COMMAND:\n" . $command . "\n\nSTDOUT:\n" . $stdout . "\n\nSTDERR:\n" . $stderr . "\n";
        }

        // Read JSON from file
        $jsonfile = fopen($jsonFileName, "r") or die("Unable to open '$jsonFileName' file!");
        $jsonsize = filesize($jsonFileName);
        if ($jsonsize > 0) {
            $json = fread($jsonfile, $jsonsize);
        } else {
            $json = "CodeChecker CLI error: failed to execute CodeChecker";
            $json .= "\n......................\n" . $output;
        }
        fclose($jsonfile);
        unlink($jsonFileName);

        if ($this->debug) {
            echo "Output:<pre>$output</pre>";
            echo "JSON ($jsonFileName):<pre>$json</pre>";
        }
        return $json;
    }

    protected function getCommand($command, $json = false)
    {
        if ($this->getPath())
            $path = "export PATH=\$PATH:" . $this->getPath() . " && ";
        else
            $path = "";
        $command = "CodeChecker " . $command;
        if ($json)
            $json = " --output=json > " . $json;
        else
            $json = "";
        return $path . $command . $json;
    }

    protected function getPath()
    {
        return $this->path;
    }

    protected function getServerUrl()
    {
        return $this->serverUrl;
    }

    protected function getProductUrl()
    {
        return $this->getServerUrl() . "/" . $this->product;
    }

    protected $path;
    protected $product;
    protected $serverUrl;
}

function execute_shell_command($cmd, &$stdout = null, &$stderr = null)
{
    $proc = proc_open($cmd, [
        1 => ["pipe", "w"],
        2 => ["pipe", "w"],
    ], $pipes);
    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[2]);
    return proc_close($proc);
}

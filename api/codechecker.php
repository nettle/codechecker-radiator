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

    public function getSummary($component = false, $date = false)
    {
        $command = "cmd sum --all";
        if ($component)
            $command .= " --component=" . $component;
        if ($date)
            $command .= " --fixed-at=" . $date;
        $command .= " --url=" . $this->getProductUrl();
        $result = $this->execute($command);
        return $result;
    }

    protected function execute($command)
    {
        $jsonFileName = tempnam(sys_get_temp_dir(), "codechecker-result.json.");
        $command = $this->getCommand($command, $jsonFileName);
        if ($this->debug)
        {
            echo "Running: <b>$command</b><br>";
        }
        $output = shell_exec($command);

        // Read JSON from file
        $jsonfile = fopen($jsonFileName, "r") or die("Unable to open '$jsonFileName' file!");
        $json = fread($jsonfile, filesize($jsonFileName));
        fclose($jsonfile);
        unlink($jsonFileName);

        if ($this->debug)
        {
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

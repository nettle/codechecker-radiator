var timeLineChart = {
    // Public:
    draw: function(date, issues) {
        try {
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

#!/usr/bin/env RScript


#!/usr/bin/env Rscript 
# ok, that's the shebang notation to run Rscript but this sucker does not run

# setwd("c:/pg/R/pedo")

# suppressPackageStartupMessages(library("optparse"))
library('optparse')
require('ggplot2')

option_list = list(
   make_option(c("-w", "--width"), action="set_width", type='integer', dest='width', default=1600),
   make_option(c('-n', '--name'), dest='name', default='pedometer.png'),
   make_option(c('-d', '--data'), dest='dataName', default='history.csv')
   )

args = parse_args(OptionParser(option_list = option_list))


# this might work...passing in thename in args$name isn't working.
# we have to do this before adjusting all the paths from the argument list
setwd('images')

#scaleFactor = 0.5
width=args$width
height = floor(width*9/16)
fullDataFilePath = args$dataName
cat('testing for existence of ',fullDataFilePath,'\n')
if (!file.exists(fullDataFilePath)) {
  fullDataFilePath = '../'+fullDataFilePath
  cat('modified fullDataFilePath to ',fullDataFilePath,'\n')
}
cat(sprintf('image size will be %d wide by %d high\n', width, height))
cat(sprintf('data is in %s\n', fullDataFilePath))
cat(sprintf('output file name will be %s\n', args$name))

cat(sprintf('this is ok %d? \n', 7))

# png(file=args$name,
	# width=4,
	# height=.75,
	# units="in",
	# res=600,
	# pointsize=2
    # )

png(file=args$name,
    width = width,
	height = height
    )

all = read.csv(fullDataFilePath)

cat('the original input has ',length(all$pedo),' elements\n')

cat('hi tom\n')

date = strptime(all[["date"]],"%m/%d/%y")
pedo = all[["pedo"]]

cat('how long is pedo?  ',length(pedo),'\n')
len = min(365,length(pedo))
date = date[1:len]
pedo = pedo[1:len]

#cat(sprintf('size of pedometer history is %d\n', length(pedo)))
cat('that makes no sense...our file was ',fullDataFilePath,'\n')

firstDate = tail(date,1)
lastDate = head(date,1)
dayMinus7 = tail(head(date,7),1)
dayMinus30 = tail(head(date,30),1)

maxPedo = max(pedo)
committed = 10000

cat('pedo=',pedo)
cat('maxPedo=',maxPedo,'\n')

plotRange = c(min(pedo),max(pedo));
yAvg = mean(pedo[1:7])
ySd = sd(pedo[1:7])
yPlus = yAvg+2*ySd
yMinus = yAvg-2*ySd
plotRange = c(min(min(pedo),floor(yMinus)),max(max(pedo),ceiling(yPlus)))

print(plotRange)

cat(sprintf("range:  %d - %d\n",plotRange[1],plotRange[2]));
		# main="Pedometer [I do not want this]", cex.main=1.5,
graph = qplot( date, pedo, type="o",
		cex.axis=.5,
		xlab="", ylab="", cex.lab=.1,
        main=NULL,
        cex.main=1,
		ylim=plotRange)


# this particular graph could benefit from log display but the data isn't quite
# as robust as the people that wrote ggplot2 think it ought to be
# myPlot + scale_y_log10()

stdev = sd(pedo)
mu = mean(pedo)

t = 2
mMinus = mu - t*stdev
mPlus = mu + t*stdev
lab1 = sprintf("95%% range:  %.0f, %.0f\n", mMinus, mPlus)
graph + geom_hline(colour='green', yintercept=mu)
#graph + geom_hline(colour='blue', yintercept=mPlus)
#      + geom_hline(colour='blue', yintercept=mMinus)
cat(lab1)
print(date[pedo > mPlus])
print(date[pedo < mMinus])

#polygon(c(firstDate,lastDate,lastDate,firstDate),c(mMinus,mMinus,mPlus,mPlus),col='lightgrey',density=40)

plotAvg = function(x,y,nDays=7,lty=1, lwd=1, col='black') {
	nDays = min(c(length(y), nDays))
	yAvg = mean(y[1:nDays])
	ySd = sd(y[1:nDays])
	yPlus = yAvg+2*ySd
	yMinus = yAvg-2*ySd
	cat(nDays," day average is ", sprintf("%.0f",yAvg), ", range is (", sprintf("%.0f, %.0f", yMinus, yPlus), ").\n")
	oldX = tail(head(x, nDays), 1)
	newX = head(x, 1)
	lines( c(oldX, newX), c(yAvg, yAvg), lty=lty, lwd=lwd, col=col)
	lines( c(oldX, newX), c(yMinus, yMinus), lty=lty, lwd=lwd, col=col)
	lines( c(oldX, newX), c(yPlus, yPlus), lty=lty, lwd=lwd, col=col)
}

#plotAvg(date, pedo, 365, lty=2)
#plotAvg(date, pedo, 30, lwd=2, col='blue')
#plotAvg(date, pedo, 7, lty=1, lwd=3, col='red')
# plotRange(date, pedo, 30, lty=1, lwd=3, col='yellow')
#lines( c(firstDate, lastDate), c(committed, committed), lty=1, lwd=3)

# text( firstDate, maxPedo, lab1, adj=c(0,1), cex=1.3 )

# one day a month we slack off
RANGE_TARGET = 1-12/365.25
# one day a week
# RANGE_TARGET = 1-1/7
# one day ever four weeks
# RANGE_TARGET = 1-1/28
# one day every six weeks
# RANGE_TARGET = 1-1/42
# 0.975
dayLimit = 10000
prevLimit = 0
prevPct = 1
while (mean(pedo >= dayLimit)[1] >= RANGE_TARGET) {
  temp = mean(pedo >= dayLimit)[1]
  dayLimit = dayLimit + 1
  if (temp < prevPct) {
    prevLimit = dayLimit
    prevPct = temp
  }
}

pctLow = mean(pedo >= dayLimit)[1]
pctHigh = prevPct
interpolated = dayLimit + (prevLimit - dayLimit)*((RANGE_TARGET - pctLow)/(pctHigh - pctLow))

# cat(sprintf("%.2f %% of the time we were over %d steps\n", 100*mean(pedo >= dayLimit)[1], dayLimit))
# cat(sprintf("%.2f %% of the time we were over %d steps\n", 100*prevPct, prevLimit))


cat(sprintf("\nAs of %s\n",format(date[1],"%m/%d/%Y")))
cat(sprintf("We covered %d steps in %d days\n", sum(pedo)[1], length(pedo)))
cat(sprintf("That is %d steps per day on average\n", round(mean(pedo)[1])))
cat(sprintf("On %.2f %% of days we walked over %d steps\n\n", 100*RANGE_TARGET, round(interpolated)))

dev.off()

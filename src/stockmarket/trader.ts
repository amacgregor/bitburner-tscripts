import { NS } from '../../NetscriptDefinitions'
import { formatMoney } from '/lib/format.js';

export async function main(ns: NS): Promise<void> {
    //*********PARAMS FOR SCRIPT ************//
    var maxSharePer = 0.45                  // maximum percent of a symbol's total stock to buy
    var stockBuyPer = 0.6                  //  percent probablity to buy symbol
    var stockVolPer = .03                 //   percent stock will move to buy
    var moneyKeep = 1000000000           //    min money to keep on hand
    var minSharePer = 5                 //     min shares to buy
    var orderMax = 1000000000000       //      max money to spend on a single order
    var profPer = 0.05                //       min profit percentage to sell
    var panicPer = 0.15              //        percentage loss to panic sell at
    //******************************//
    while (true) {
        var stocks = ns.stock.getSymbols();
        for (const stock of stocks) {
            ns.disableLog('disableLog');
            ns.disableLog('sleep');
            ns.disableLog('getServerMoneyAvailable');
            var position = ns.stock.getPosition(stock)
            var forecast = ns.stock.getForecast(stock);
            if (position[0]) {
                ns.print('Position: ' + stock + ", " + position[0] + " Profit: " + ns.nFormat(Math.round(ns.stock.getSaleGain(stock, position[0], "Long") - (position[0] * position[1])), '0,0', "Long") + ' % ' + ns.nFormat(ns.stock.getSaleGain(stock, position[0], "Long") / (position[0] * position[1]), "0%"));
                sellPositions(stock);
            }
            buyPositions(stock);

        }
        await ns.sleep(6000);
    }
    function sellPositions(stock) {
        //sell if only 40% chance increase
        if (ns.stock.getForecast(stock) < 0.4) {
            //sell stock
            ns.toast("SOLD STOCK " + stock + " for " + ns.nFormat(Math.round(ns.stock.getSaleGain(stock, position[0], "Long") - (position[0] * position[1])), '0,0') + " profit!");
            ns.stock.sell(stock, position[0]);
        }
    }

    function buyPositions(stock) {
        var maxShares = (ns.stock.getMaxShares(stock) * maxSharePer) - position[0];
        var askPrice = ns.stock.getAskPrice(stock);
        var forecast = ns.stock.getForecast(stock);
        var volPer = ns.stock.getVolatility(stock);
        var minBuy = 10000000;
        var playerMoney = ns.getServerMoneyAvailable('home');

        if (maxShares == 0) {
            ns.print(`Share limit reached for ${stock}`);
            return;
        }

        //if the stock will move positive by stockbuyper or more and it will grow stockvolper or more
        if (forecast >= stockBuyPer && volPer <= stockVolPer) {
            //check money for one share
            if (playerMoney - moneyKeep > ns.stock.getPurchaseCost(stock, minSharePer, "Long")) {
                var shares = Math.min((playerMoney - moneyKeep - 100000) / askPrice, orderMax / askPrice);
                if (shares * askPrice > minBuy) {
                    ns.stock.buy(stock, Math.min(shares, maxShares));
                    ns.toast("PURCHASED " + Math.min(shares, maxShares).toLocaleString('en-US') + " of " + stock + " at " + formatMoney(askPrice), "info", 6000);

                }
            }
        }
    }
}
import { NS } from '../../NetscriptDefinitions'
import { formatMoney, formatNumber } from "/lib/format.js";

export async function main(ns : NS) : Promise<void> {
    ns.disableLog('ALL');

    const stockSymbols = ns.stock.getSymbols();
    stockSymbols.forEach((stockSymbol) => {
        //@TODO: Handle short positions
        let [long_pos, long_avg, short_pos, short_avg] = ns.stock.getPosition(stockSymbol)

        let profit = 0;

        if(long_pos){ 
            let current_cost = long_pos * long_avg;
            let sales_gain = ns.stock.getSaleGain(stockSymbol, long_pos, 'Long');
            profit = sales_gain - current_cost;

            ns.tprint(`Position: ${long_pos.toLocaleString('en-US')} Shares of ${stockSymbol} at ${formatMoney(long_avg)} per share`);
            ns.tprint(`	↳ Sell Price: ${formatMoney(sales_gain)} Cost: ${formatMoney(current_cost)} Profit: ${formatMoney(profit)}`);

            if (profit > 0) {
                ns.stock.sell(stockSymbol, long_pos);
            } else {
                ns.toast(`Couldn't sell ${stockSymbol} for a profit.`, "error", 4000)
            }
        }
    })
}
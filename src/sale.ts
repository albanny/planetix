import { BigInt } from "@graphprotocol/graph-ts";
import { createAccount } from "./account";
import {
  SaleRequested,
  SaleUpdated,
  SaleCancelled,
  Purchased,
  PurchasedWithSignature,
} from "./entities/PIXFixedSale/PIXFixedSale";
import { Global, Sale, SaleLog, PIX } from "./entities/schema";

export function handleSaleRequested(event: SaleRequested): void {
  let entity = Global.load("fixedSales");
  if (entity == null) {
    entity = new Global("fixedSales");
    entity.value = new BigInt(0);
  }
  entity.value = entity.value.plus(BigInt.fromI32(1));
  entity.save();

  let salesEntity = Global.load("pixOnSale");
  if (salesEntity == null) {
    salesEntity = new Global("pixOnSale");
    salesEntity.value = new BigInt(0);
  }
  salesEntity.value = salesEntity.value.plus(
    BigInt.fromI32(event.params.tokenIds.length)
  );
  salesEntity.save();

  let sale = new Sale(getSaleId(event.params.saleId));
  sale.type = BigInt.fromI32(1);
  sale.isActive = true;
  createAccount(event.params.seller);
  sale.requestor = event.params.seller.toHexString();
  sale.tokenIds = event.params.tokenIds;
  sale.tokens = BigInt.fromI32(sale.tokenIds.length);
  sale.price = event.params.price;
  sale.createTimestamp = event.block.timestamp;
  sale.save();

  let tokenIds = sale.tokenIds as Array<BigInt>;
  for (let i = 0; i < tokenIds.length; i++) {
    let pix = PIX.load(getPIXId(tokenIds[i]));
    if (pix != null) {
      pix.sale = sale.id;
      pix.save();

      if (i == 0) {
        sale.category = pix.category;
        sale.size = pix.size;
        sale.save();
      }
    }
  }

  let totalEntity = Global.load("totalSaleLogs");
  if (totalEntity == null) {
    totalEntity = new Global("totalSaleLogs");
    totalEntity.value = new BigInt(0);
  }

  let saleLog = new SaleLog(totalEntity.value.toString());
  saleLog.logId = totalEntity.value;
  saleLog.sale = getSaleId(event.params.saleId);
  saleLog.status = BigInt.fromI32(0);
  saleLog.save();

  totalEntity.value = totalEntity.value.plus(BigInt.fromI32(1));
  totalEntity.save();
}

export function handleSaleUpdated(event: SaleUpdated): void {
  let sale = Sale.load(getSaleId(event.params.saleId));
  sale.price = event.params.newPrice;
  sale.save();

  let totalEntity = Global.load("totalSaleLogs");

  let saleLog = new SaleLog(totalEntity.value.toString());
  saleLog.logId = totalEntity.value;
  saleLog.sale = getSaleId(event.params.saleId);
  saleLog.status = BigInt.fromI32(3);
  saleLog.price = event.params.newPrice;
  saleLog.save();

  totalEntity.value = totalEntity.value.plus(BigInt.fromI32(1));
  totalEntity.save();
}

export function handleSaleCancelled(event: SaleCancelled): void {
  let sale = Sale.load(getSaleId(event.params.saleId));
  sale.isActive = false;
  sale.save();

  let entity = Global.load("fixedSales");
  entity.value = entity.value.minus(BigInt.fromI32(1));
  entity.save();

  let salesEntity = Global.load("pixOnSale");
  salesEntity.value = salesEntity.value.minus(
    BigInt.fromI32(sale.tokenIds.length)
  );
  salesEntity.save();

  let totalEntity = Global.load("totalSaleLogs");

  let saleLog = new SaleLog(totalEntity.value.toString());
  saleLog.logId = totalEntity.value;
  saleLog.sale = getSaleId(event.params.saleId);
  saleLog.status = BigInt.fromI32(1);
  saleLog.save();

  totalEntity.value = totalEntity.value.plus(BigInt.fromI32(1));
  totalEntity.save();
}

export function handleSalePurchased(event: Purchased): void {
  let sale = Sale.load(getSaleId(event.params.saleId));
  createAccount(event.params.buyer);
  sale.taker = event.params.buyer.toHexString();
  sale.price = event.params.price;
  sale.isActive = false;
  sale.soldDate = event.block.timestamp;
  sale.save();

  let entity = Global.load("fixedSales");
  entity.value = entity.value.minus(BigInt.fromI32(1));
  entity.save();

  let salesEntity = Global.load("pixOnSale");
  salesEntity.value = salesEntity.value.minus(
    BigInt.fromI32(sale.tokenIds.length)
  );
  salesEntity.save();

  let totalEntity = Global.load("totalSaleLogs");

  let saleLog = new SaleLog(totalEntity.value.toString());
  saleLog.logId = totalEntity.value;
  saleLog.sale = getSaleId(event.params.saleId);
  saleLog.status = BigInt.fromI32(2);
  saleLog.save();

  totalEntity.value = totalEntity.value.plus(BigInt.fromI32(1));
  totalEntity.save();
}

export function handleSalePurchasedWithSignature(
  event: PurchasedWithSignature
): void {
  let entity = Global.load('fixedSalesWithHash');
  if (entity == null) {
    entity = new Global('fixedSalesWithHash');
    entity.value = new BigInt(0);
  }

  let sale = new Sale(getSaleWithHashId(entity.value));
  createAccount(event.params.seller);
  createAccount(event.params.buyer);
  sale.type = BigInt.fromI32(1);
  sale.isActive = false;
  sale.taker = event.params.buyer.toHexString();
  sale.requestor = event.params.seller.toHexString();
  sale.tokenIds = [event.params.tokenId];
  sale.tokens = BigInt.fromI32(1);
  sale.price = event.params.price;
  sale.createTimestamp = event.block.timestamp;
  sale.soldDate = event.block.timestamp;
  sale.save();

  let totalEntity = Global.load('totalSaleLogs');
  if (totalEntity == null) {
    totalEntity = new Global('totalSaleLogs');
    totalEntity.value = new BigInt(0);
  }

  let saleLog = new SaleLog(totalEntity.value.toString());
  saleLog.logId = totalEntity.value;
  saleLog.sale = getSaleWithHashId(entity.value);
  saleLog.status = BigInt.fromI32(2);
  saleLog.save();

  totalEntity.value = totalEntity.value.plus(BigInt.fromI32(1));
  totalEntity.save();

  entity.value = entity.value.plus(BigInt.fromI32(1));
  entity.save();
}

function getSaleId(id: BigInt): string {
  return "F" + id.toString();
}

function getSaleWithHashId(id: BigInt): string {
  return 'H' + id.toString();
}

function getPIXId(id: BigInt): string {
  return "PIX - " + id.toString();
}

import assert from "node:assert/strict";
import test from "node:test";
import {fetchSavedOrder,OrderReadError} from "../src/lib/order-client";
const id="20000000-0000-4000-8000-000000000001";
const order={id,product_id:id,buyer_id:id,quantity:1,total_amount:100.25,escrow_status:"pending",tracking_number:null,created_at:"2026-11-08T00:00:00Z"};
const request=(body:unknown,status=200,type="application/json")=>(async()=>new Response(type==="application/json"?JSON.stringify(body):"<html>Not implemented</html>",{status,headers:{"content-type":type}})) as typeof fetch;
test("saved order UI only accepts a validated matching server record",async()=>{
 assert.deepEqual(await fetchSavedOrder(id,undefined,request({ok:true,data:{order}})),order);
 for(const invalid of [{...order,id:"20000000-0000-4000-8000-000000000002"},{...order,total_amount:-1},{...order,quantity:0}])await assert.rejects(fetchSavedOrder(id,undefined,request({ok:true,data:{order:invalid}})),e=>e instanceof OrderReadError&&e.kind==="invalid");
});
test("missing API, missing order, denied access and invalid reference remain distinct",async()=>{
 await assert.rejects(fetchSavedOrder(id,undefined,request({},404,"text/html")),e=>e instanceof OrderReadError&&e.kind==="unavailable");
 await assert.rejects(fetchSavedOrder(id,undefined,request({code:"NOT_FOUND"},404)),e=>e instanceof OrderReadError&&e.kind==="missing");
 await assert.rejects(fetchSavedOrder(id,undefined,request({},403)),e=>e instanceof OrderReadError&&e.kind==="denied");
 await assert.rejects(fetchSavedOrder("not-an-id",undefined,request({})),e=>e instanceof OrderReadError&&e.kind==="invalid");
});

import { outputAst } from '@angular/compiler';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { GetCustomer } from '../interface/get-customer';
import { GetItems } from '../interface/get-items';
import { GetSales } from '../interface/get-sales';
import { InvoicePopupComponent } from '../invoice-popup/invoice-popup.component';
import { CustomersService } from '../services/customers.service';

@Component({
  selector: 'app-reg-sales',
  templateUrl: './reg-sales.component.html',
  styleUrls: ['./reg-sales.component.scss']
})
export class RegSalesComponent implements OnInit {
  userdetails!: GetCustomer;
  salesForm!: FormGroup;
  items: Array<any> = [];
  columnHeaderArray: string[] = ["select", "Date", "Item", "Quantity", "Unit Price", "Total Price", "Actions"];
  columnsDataArray: GetSales[] = [];
  @ViewChild('drawer') sideDrawer!: MatDrawer;
  @ViewChild('title') sideNavTitle!: ElementRef<HTMLHeadingElement>;
  @ViewChild('salesSubmit', { static: true }) salesButton!: ElementRef<HTMLButtonElement>;
  edited!: boolean;
  salesId!: number;
  constructor(public dialog: MatDialog, private route: ActivatedRoute, private fb: FormBuilder, private service: CustomersService) {
  }

  ngOnInit(): void {
    this.salesForm = this.fb.group({
      createdAt: new FormControl(new Date(), [Validators.required]),
      item: new FormControl('', [Validators.required]),
      item_Qty: new FormControl('', [Validators.required, Validators.min(1)]),
      item_Price: new FormControl('', [Validators.required, Validators.min(1)])
    })
    this.userdetails = this.route?.snapshot?.data['getprofile'];
    console.log(this.userdetails);
    this.getItems();
    this.getSales(this.userdetails?.u_id);
  }

  submit() {
    console.log(this.salesForm.value);
    const output = this.salesForm.value;
    output["person"] = this.userdetails.u_id;
    this.service.regSales(output).subscribe((data: any) => {
      console.log(data);
      // this.sideDrawer.close();
      this.getSales(this.userdetails?.u_id);
      this.resetAddForm();
      this.salesForm.get(['item', 'item_Qty', 'item_Price'])?.reset();
      //this.salesForm.reset({ createdAt: new Date() });
    })
  }



  resetAddForm() {
    this.salesForm.get('item')?.reset();
    this.salesForm.get('item_Qty')?.reset();
    this.salesForm.get('item_Price')?.reset();
  }

  getSales(userid: number) {
    this.service.getSales(userid).subscribe((data: GetSales[]) => {
      console.log(data);
      this.columnsDataArray = [...data];
    })
  }
  getItems() {
    this.service.getItems().pipe(map((data: GetItems[]) => data?.filter((output: GetItems) => output?.item_Status === true))).subscribe((data: GetItems[]) => {
      console.log(data);
      this.items = data;
    })
  }

  generateInvoice(itemsArray: any) {
    console.log(itemsArray);
    const dialogRef = this.dialog.open(InvoicePopupComponent,
      {

        data: { userdetails: this.userdetails, items: itemsArray },
      });
  }

  ModifiedSubmit() {
    const body = this.salesForm.value;
    body["person"] = this.userdetails.u_id;
    console.log(body);
    this.service.updateSales(this.salesId, body).subscribe((data: any) => {
      console.log(data);
      this.getSales(this.userdetails.u_id);
      this.salesForm.reset();
      this.edited = false;
      this.sideNavTitle.nativeElement.innerText = "Add Sales";

    })
  }

  editSales(data: any) {
    console.table(data);
    this.salesId = data?.id;
    this.salesForm.setValue({
      createdAt: new Date(data?.createdAt),
      item: data?.i_id,
      item_Qty: data?.qty,
      item_Price: data?.price
    });
    this.sideNavTitle.nativeElement.innerText = "Edit Sales";

    this.edited = true;
    this.sideDrawer.open();

  }
  /*
  closeDrawer() {
    this.edited=false;
    this.sideDrawer.close();
    this.salesForm.reset({ 'createdAt': new Date() });
  }*/
  openDrawer() {
    this.sideNavTitle.nativeElement.innerText = "Add Sales";
    this.salesForm.get('createdAt')?.enable();
    this.edited = false;
    this.sideDrawer.open();
  }

  deleteSales(data: any) {
    console.log(data);
    const action = data.action;
    this.service.deleteSales(data.deletionString).subscribe((data: any) => {
      action.clear();
      this.getSales(this.userdetails.u_id)
    })
  }
  filterSalesByDate(range: { "start": string, "end": string }) {
    console.log(range);
    this.service.filterSales(this.userdetails.u_id, range).subscribe((data: any) => {
      console.log(data);
      this.columnsDataArray = [...data];
    })

  }
}


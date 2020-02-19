import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { DadosService } from '../dados.service';
import { TooltipService } from '../tooltip.service';

@Component({
  selector: 'app-dashboard-fatecoins3',
  templateUrl: './dashboard-fatecoins3.component.html',
  styleUrls: ['./dashboard-fatecoins3.component.css']
})
export class DashboardFatecoins3Component implements OnChanges {

  @Input()
  private clientsData:any[] = [];
  private areasData:any[] = [];

  //Variáveis que resultarão nos gráficos
  private pieChart:any[];
  private bulletChart:any[];
  private barChart:any[];
  private donutChart:any[];

  //Variáveis auxiliares
  private axisNamesBullet: string[];
  private axisNamesBar: string[];
  private bulletHeight = 250;
  private card1:string[];
  private card2:string[];
  private card3:string[];
  private card4:string[];
  private colors:any[];

  constructor(private _dados: DadosService, private _tooltip: TooltipService) { 
    this.cardsAjust();
    this.obDados();
  }

  ngOnChanges() {
    if(!this.clientsData)
      return;
    this.obDados();
  }

  private async obDados(){
    await this.obtemDados();
    this._dados.closeConnection();
    this.areasData = this._tooltip.convertClientsDataToPages(this.clientsData);

    this.donutAjust();
    this.pieAjust();
    this.bulletAjust();
    this.barAjust();
    this.cardInsertData();
    this.fillAxis();
  }

  private async obtemDados(){
    this.clientsData = await this._dados.getEventsFatec("match (u:User)-[t:TRIGGERED]->(e:Event)-[i:IN]->(p:Page) match (e:Event)-[o:ON]->(l:Element) with u.client_id as cliente, e.date_str as data, l order by data where p.id =~ '.*fate.*'and  e.date_str <= '2019-11-30' and e.date_str >= '2019-10-22'  return cliente, collect([data, l.id, l.tag_classes]) as dados");
  }

  private cardsAjust(){
    this.cardAjust("", "", "", "", "",1);
    this.cardAjust("", "", "","", "", 2);
    this.cardAjust("", "", "","", "",3);
    this.cardAjust("", "", "","", "",4);
  }

  private cardInsertData(){
    var totalAreas;
    totalAreas = this.areasData.length;
    
    var medEvents = 0;
    var medClients = 0;
    var medTime = 0; 
    var medPages = this.areasAccess(this.clientsData);

    this.areasData.forEach(element => {
      medEvents += element["Events"].length;
      medTime += (element["Time"])/element["Clients"].length;
      medClients += element["Clients"].length;
    });
    
    medEvents /= totalAreas;
    medClients /= totalAreas;

    this.cardAjust("Clientes", (medClients).toFixed(2), " de Média por Página", (this.calcDeviationClients(medClients, totalAreas)).toFixed(2), " de Desvio Padrão", 1);
    this.cardAjust("Eventos", (medEvents).toFixed(2), " de Média por Página", this.calcDeviationEvents(medEvents, totalAreas).toFixed(2), " de Desvio Padrão ",2);
    this.cardAjust("Tempo Total", (medTime).toFixed(2) +" minutos", " de Média por Página", this.calcDeviationTime(medTime, totalAreas).toFixed(2), " de Desvio Padrão ", 3);
    this.cardAjust("Páginas", (medPages).toFixed(2), " Páginas médias por usuários", this.calcDeviationPages(medPages, totalAreas).toFixed(2), " de Desvio Padrão", 4);
    //media de paginas acessadas pro usuario
  }

  private cardAjust(cardName:string, cardValue:string, info:string, extraInfo:string, extraValue:string, cardOpt){
    var lista:string[] = [];
    
    lista.push(cardName);
    lista.push(cardValue);
    lista.push(info);
    lista.push(extraInfo);
    lista.push(extraValue);

    if(cardOpt == 1)
      this.card1 = lista;
    else if(cardOpt == 2)
      this.card2 = lista;
    else if(cardOpt == 3)
      this.card3 = lista;
    else
      this.card4 = lista;
  }

  private fillAxis(){
    this.axisNamesBullet = [];
    this.axisNamesBar = [];

    this.axisNamesBullet.push("Clientes");
    this.axisNamesBullet.push("Páginas");
    
    this.axisNamesBar.push("Páginas");
    this.axisNamesBar.push("Tempo Médio por Cliente");
    
    this.colors = [];
    this.colors.push("#F1C40F");
    this.colors.push("#2980B9");
    this.colors.push("#2ECC71");
    this.colors.push("#E74C3C");
    this.colors.push("#ECF0F1");
    this.colors.push("#AEB6BF");
  }

  private bulletAjust(){
    var arr;
    this.bulletChart = [];

    this.areasData.forEach(element => {
      arr = [];
      arr.push(element["Name"]);
      arr.push(element["Clients"].length);
      this.bulletChart.push(arr);
    });

  }

  private pieAjust(){
    var arr:any[], cont;
    this.pieChart = [];
    this.areasData.forEach(element => {
      arr = [];
      cont = 0;
      element["Clients"].forEach(data => {
        cont += data["Choose"];
      });
      
      arr.push(element["Name"]);
      arr.push(cont);
      this.pieChart.push(arr);
    });
  }

  private donutAjust(){
    var arr:any;
    this.donutChart = [];

    this.areasData.forEach(element => {
      arr = [];
      arr.push(element["Name"]);
      arr.push(element["Events"].length);
      this.donutChart.push(arr);
    });
  }

  private barAjust(){
    var arr;
    this.barChart = [];

    this.areasData.forEach(element => {
      arr = [];
      arr.push(element["Name"]);
      arr.push(element["Time"]/element["Clients"].length);
      this.barChart.push(arr);
    });
  }

  private calcDeviationTime(medium, total){
    var deviation = 0;
    this.areasData.forEach(element => {
      deviation += Math.pow(element["Time"] - medium , 2);// faz a conta para balancear novamente os minutos, ja que timeMed esta em milisegundos
    }); 

    deviation /= total;
    deviation = Math.pow(deviation, 1/2);

    return deviation; 
  }

  private calcDeviationClients(medium, total){
    var deviation = 0;

    this.areasData.forEach(element => {
      deviation += Math.pow(element["Clients"].length-medium, 2) ;
    });

    deviation /= total;
    deviation = Math.pow(deviation, 1/2);

    return deviation;
  }

  private calcDeviationPages(medium, total){
    var deviation = 0, test:boolean, lengthEvents;
    var events:any[];
    var arr:any[];

    events = [];

    this.clientsData.forEach(element => {
      test = false;
      lengthEvents = element["Pages"].length;
      events.forEach(data => {
        if(data[0] == lengthEvents){
          data[1] ++;
          test = true;
        }
      });

      if(!test){
        arr = [];
        arr.push(lengthEvents);
        arr.push(1);
        events.push(arr);
      }
    });
    
    events.forEach(element => {
      deviation += Math.pow(element[0] - medium, 2)*element[1];
    });

    deviation /= total;
    deviation = Math.pow(deviation, 1/2);

    return deviation;
  }

  private calcDeviationEvents( medium, total){
    var deviation = 0, test:boolean, lengthEvents;
    var events:any[];
    var arr:any[];

    events = [];

    this.areasData.forEach(element => {
      test = false;
      lengthEvents = element["Events"].length;
      events.forEach(data => {
        if(data[0] == lengthEvents){
          data[1] ++;
          test = true;
        }
      });

      if(!test){
        arr = [];
        arr.push(lengthEvents);
        arr.push(1);
        events.push(arr);
      }
    });
    
    events.forEach(element => {
      deviation += Math.pow(element[0] - medium, 2)*element[1];
    });

    deviation /= total;
    deviation = Math.pow(deviation, 1/2);

    return deviation;

  }

  private areasAccess(clientsData:any[]){
    var areas = 0;
    clientsData.forEach(element => {
      areas += element["Pages"].length;
    });
    
    return areas/clientsData.length;
  }

}
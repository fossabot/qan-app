import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { InstanceService } from './core/instance.service';
import { AddAwsComponent } from './add-aws/add-aws.component';
import { AddRemotePostgresComponent } from './add-remote-postgres/add-remote-postgres.component';
import { AddInstanceComponent } from './add-instance/add-instance.component';
export function getInstances(instanceService: InstanceService) {
  return function () { return instanceService.getDBServers(); };
}

@NgModule({
  declarations: [
    AppComponent,
    AddAwsComponent,
    AddRemotePostgresComponent,
    AddInstanceComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    CoreModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    SharedModule,
  ],
  providers: [
    InstanceService,
    {
      provide: APP_INITIALIZER,
      useFactory: getInstances,
      deps: [InstanceService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

let acceptedOffersDashboard = p5i => {
  p5i.disableFriendlyErrors = true;
  p5i.agents = [ "Family", "MDocBroker", "Recruiter", "Smuggler", "Facilitator", "TDocBroker" ];
  p5i.colors = [ "#003f5c", "#3f4d84", "#8c4e95", "#d34b84", "#fe5f58", "#ff920d" ];

  let w,h,b;
  let scenarioDataSet = [];
  let cumulativeAcceptedOfferPerTick = {};

  for( let t=1; t<=1825; t++ ){
    cumulativeAcceptedOfferPerTick[ t ] = {
      "Facilitator"               :0,
      "Family"                    :0,
      "MyanmarDocumentBroker"     :0,
      "Recruiter"                 :0,
      "Smuggler"                  :0,
      "ThailandDocumentBroker"    :0
    };
  }

  p5i.setup = function( ){
    p5i.createCanvas(1080, 1080);
    p5i.frameRate(10);
    b = 70;
    w = p5i.width - b;
    h = p5i.height - b*2;
  }

  p5i.draw = function( ){
    p5i.drawLabels();
 
    if( frameCount >0 ){
      p5i.tick = outputData[frameCount];
      for( let u = frameCount; u<=1825; u++ ){
        cumulativeAcceptedOfferPerTick[ u ].Facilitator             += p5i.tick.ao.Facilitator;
        cumulativeAcceptedOfferPerTick[ u ].Family                  += p5i.tick.ao.Family;
        cumulativeAcceptedOfferPerTick[ u ].MyanmarDocumentBroker   += p5i.tick.ao.MyanmarDocumentBroker;
        cumulativeAcceptedOfferPerTick[ u ].Recruiter               += p5i.tick.ao.Recruiter;
        cumulativeAcceptedOfferPerTick[ u ].Smuggler                += p5i.tick.ao.Smuggler;
        cumulativeAcceptedOfferPerTick[ u ].ThailandDocumentBroker  += p5i.tick.ao.ThailandDocumentBroker;
      }
    }

    for( a=0; a<p5i.agents.length; a++ ){
      p5i.push();
      p5i.noFill();
      p5i.strokeWeight(10);
      p5i.stroke( p5i.colors[a] );
      p5i.beginShape();
      for( const [ t, ao ] of Object.entries( cumulativeAcceptedOfferPerTick ) ){
        if(t <= frameCount){
          let x = p5i.map( t, 1, 1825, b + 20, w + 20 );
          let y = p5i.map( ao[ p5i.agents[a] ], 0, 200, h+10, b );
          p5i.curveVertex( x, y);
        }
      }
      p5i.endShape();
      p5i.pop();
    }

  }

  p5i.drawLabels = function(){
    //chart
    p5i.background(245);
    p5i.push();
    p5i.stroke(100);
    p5i.strokeWeight(1);
    p5i.fill(100);
    p5i.textSize(20);
    p5i.translate(20,15);

    // x axis
    let sx = 5;
    p5i.textAlign(p5i.CENTER,p5i.TOP);
    p5i.line(b,h,w,h);
    for( let i=sx; i>=0; i--){
      let x = p5i.map( i, 0, sx, b, w );
      let y = p5i.map( i, 0, sx, b, h );
      p5i.line(x,h,x,h+5);
      if(i!=0) p5i.text(i,x,h+10)
    }

    for( let i=0; i<p5i.agents.length; i++){
      p5i.push();
      p5i.textAlign(p5i.LEFT);
      p5i.fill( "#000" );
      p5i.text( p5i.agents[i], i*150 + 90, p5i.height - 60  )
      p5i.fill( p5i.colors[i] );
      p5i.ellipse( i*150 + 70, p5i.height-50, 20, 20);
      p5i.fill( "#000" );
      p5i.pop();
    }


    // y axis
    let sy = 4;
    p5i.textAlign(p5i.RIGHT,p5i.TOP);
    p5i.line(b,b,b,h);
    for( let i=sy; i>=0; i--){
      let x = p5i.map( i, 0, sy, w, b );
      let y = p5i.map( i, 0, sy, h, b );
      p5i.line(b,y,b-5,y);
      if(i!=0) p5i.text(i*50,b-10,y-5)
    }

    // labels
    p5i.translate(-5,5);
    p5i.textAlign(p5i.RIGHT,p5i.TOP);
    p5i.fill(100);
    p5i.stroke(100);
    p5i.text("0",b,h+5);
    p5i.text("Years",w+15,h+b*0.75);
    p5i.textAlign(p5i.CENTER,p5i.TOP);
    p5i.push();
    p5i.translate(b , b*0.5);
    p5i.textAlign(p5i.LEFT,p5i.CENTER);
    p5i.fill(100);
    p5i.text("Accepted Offers",0,-b*0.25);
    p5i.pop();
    p5i.pop();
  }

}

let acceptedOffers = new p5(acceptedOffersDashboard,'abm-accepted-offers');

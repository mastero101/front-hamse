import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappChatBubbleComponent } from './whatsapp-chat-bubble.component';

describe('WhatsappChatBubbleComponent', () => {
  let component: WhatsappChatBubbleComponent;
  let fixture: ComponentFixture<WhatsappChatBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappChatBubbleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhatsappChatBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

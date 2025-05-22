import { Component, ViewChild } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent {
  breadCrumbItems!: Array<{}>;
  id:any
  taskDetail:any;
  spinnerStatus: boolean = false;
  selectedEmpIds: number[] = [];



  formattedTime = '00:00:00';
  isStatus = 'online';
  selectedEmployee: any = null;
  submitted = false;
  isreplyMessage = false;
  formData!: UntypedFormGroup;
  company_id: any;

  @ViewChild('scrollRef') scrollRef: any;

  constructor(  private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router,private route:ActivatedRoute,private location: Location, private datePipe: DatePipe){}
  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Assign Task" },
      { label: "Task Detail", active: true },
    ];
    this.route.params.subscribe((params) => {
      this.id = params["id"] ? Number(params["id"]) : null;
    });

       this.formData = this.formBuilder.group({
            message: ['', [Validators.required]],
        });
  const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }
  
    if (this.id) {
      this.getTaskDetail();
    } 
      this.onListScroll();
  }

    ngAfterViewInit() {
        this.scrollRef.SimpleBar.getScrollElement().scrollTop = 300;
        this.onListScroll();
    }

     onListScroll() {
        if (this.scrollRef !== undefined) {
            setTimeout(() => {
                this.scrollRef.SimpleBar.getScrollElement().scrollTop = this.scrollRef.SimpleBar.getScrollElement().scrollHeight;
            }, 500);
        }
    }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    // this.saveButtonActive = !isLoading;
    // this.submitted = isLoading;
  }

  getTaskDetail() {
    this.toggleSpinner(true);
    const url = `assignTask?id=${this.id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.taskDetail= res.data[0] || [];
        } else {
         
          // this.taskDetail= [];
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  toggleSelection(empId: number, event: any) {
    const isChecked = event.target['checked'] as HTMLElement

    if (isChecked) {
      // Add employee ID if checked
      if (!this.selectedEmpIds.includes(empId)) {
        this.selectedEmpIds.push(empId)
      }
    } else {
      // Remove employee ID if unchecked
      this.selectedEmpIds = this.selectedEmpIds.filter(id => id !== empId);
    }
  }


  sendReminder() {
    if (this.selectedEmpIds.length > 0) {
      this.toggleSpinner(true);
      const payload = { emp_ids: this.selectedEmpIds, task_id: this.id };
  
      this.api.post('sendReminder', payload).subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res.status === true) {
            this.toastService.success(res.message);
            this.selectedEmpIds = [];
  
            // Force change detection (only if needed)
            setTimeout(() => {
              this.selectedEmpIds = [...this.selectedEmpIds]; 
            }, 0);
          } else {
            this.toastService.error(res.message);
          }
        },
        (error) => {
          console.error("Error sending reminder:", error);
        }
      );
    } else {
      alert("Please select at least one employee.");
    }
  }
  
  

  goBack(): void {
    this.location.back();
  }


   hideChat() {
        const userChatShow = document.querySelector('.user-chat');
        if (userChatShow != null) {
            userChatShow.classList.remove('user-chat-show');
        }
    }

       openEnd() {
        document.querySelector('.chat-detail')?.classList.add('show')
        document.querySelector('.backdrop1')?.classList.add('show')
    }


     MessageSearch() {
        var input: any, filter: any, ul: any, li: any, a: any | undefined, i: any, txtValue: any;
        input = document.getElementById("searchMessage") as HTMLAreaElement;
        filter = input.value.toUpperCase();
        ul = document.getElementById("users-conversation");
        li = ul.getElementsByTagName("li");
        for (i = 0; i < li.length; i++) {
            a = li[i].getElementsByTagName("p")[0];
            txtValue = a?.innerText;
            if (txtValue?.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    }

        deleteAllMessage(event: any) {
        var allMsgDelete: any = document.getElementById('users-conversation')?.querySelectorAll('.chat-list');
        allMsgDelete.forEach((item: any) => {
            item.remove();
        })
    }

    
    closeReplay() {
        document.querySelector('.replyCard')?.classList.remove('show');
    }
messageData:any;
receiverId:any;
    selectEmployee(employee: any) {
  this.selectedEmployee = employee;
  this.receiverId = employee.id
  this.messageData = employee.comment || [];

   const userChatShow = document.querySelector('.user-chat');
        if (userChatShow != null) {
            userChatShow.classList.add('user-chat-show');
        }
}

newMessage: string = '';

sendMessage() {
  if (!this.newMessage.trim() || !this.selectedEmployee) return;
  this.selectedEmployee.comment.push({
    text: this.newMessage,
    timestamp: new Date(),
    isSender: true
  });
  this.newMessage = '';
}
messageId:any
    replyMessage(event: any, messageId: any, recevierIdemp :any) {
this.messageId = messageId;
this.receiverId = recevierIdemp;
        this.isreplyMessage = true;
        document.querySelector('.replyCard')?.classList.add('show');
        var copyText = event.target.closest('.chat-list').querySelector('.ctext-content').innerHTML;
        (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLAreaElement).innerHTML = copyText;
        var msgOwnerName: any = event.target.closest(".chat-list").classList.contains("right") == true ? 'You' : document.querySelector('.username')?.innerHTML;
        (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLAreaElement).innerHTML = msgOwnerName;
    }

      copyMessage(event: any) {
        navigator.clipboard.writeText(event.target.closest('.chat-list').querySelector('.ctext-content').innerHTML);
        (document.getElementById("copyClipBoard") as HTMLElement).style.display = "block";
        setTimeout(() => {
            (document.getElementById("copyClipBoard") as HTMLElement).style.display = "none";
        }, 1000);
    }

      showEmojiPicker = false;
      emoji = '';
        addEmoji(event: any) {
        const { emoji } = this;
        const text = `${emoji}${event.emoji.native}`;
        this.emoji = text;
        this.showEmojiPicker = false;
    }

      get form() {
        return this.formData.controls;
    }

     onFocus() {
        this.showEmojiPicker = false;
    }
    onBlur() {
    }

     toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    //  messageSave() {
    //     const message = this.formData.get('message')!.value;
    //     if (this.isreplyMessage == true) {
    //         var itemReplyList: any = document.getElementById("users-chat")?.querySelector(".chat-conversation-list");
    //         var dateTime = this.datePipe.transform(new Date(), "h:mm a");
    //         var chatReplyUser = (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLAreaElement).innerHTML;
    //         var chatReplyMessage = (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLAreaElement).innerText;

    //         this.messageData.push({
    //             isSender: true,
    //             sender: 'Marcus',
    //             replayName: chatReplyUser,
    //             replaymsg: chatReplyMessage,
    //             message,
    //             createdAt: dateTime,
    //         });

    //     }
    //     else {
    //         if (this.formData.valid && message) {

    // //             task_id: number;
    // // sender_type: string;
    // // sender_id: number;
    // // receiver_id?: number;
    // // is_group: boolean;
    // // message: string;
    // // message_type?: string;
    // // reply_to_id?: number | null;

    //             // Message Push in Chat
    //             this.messageData.push({
    //               task_id: this.id,
    //               sender_type: 'admin',
    //                sender_id: this.company_id,
    //                receiver_id : this.selectedEmployee.id,
    //                 id: this.messageData.length + 1,
    //                 isSender: true,
    //                 sender: 'Marcus',
    //                 message,
    //                 // image: this.imageURL,
    //                 createdAt: this.datePipe.transform(new Date(), "h:mm a"),
    //             });
    //         }
    //         // if (this.imageURL) {
    //         //     // Message Push in Chat
    //         //     this.messageData.push({
    //         //         id: this.messageData.length + 1,
    //         //         isSender: true,
    //         //         sender: 'Marcus',
    //         //         image: this.imageURL,
    //         //         createdAt: this.datePipe.transform(new Date(), "h:mm a"),
    //         //     });
    //         // }
    //     }
    //     document.querySelector('.replyCard')?.classList.remove('show');
    //     (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLAreaElement).innerHTML = '';
    //     (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLAreaElement).innerHTML = '';
    //     this.isreplyMessage = false;
    //     this.emoji = '';
    //     // this.imageURL = '';

    //     this.onListScroll();
    //     // Set Form Data Reset
    //     this.formData = this.formBuilder.group({
    //         message: null,
    //     });
    //     this.formData.reset();
    // }

  //   sendReminder() {
  //   if (this.selectedEmpIds.length > 0) {
  //     this.toggleSpinner(true);
  //     const payload = { emp_ids: this.selectedEmpIds, task_id: this.id };
  
  //     this.api.post('sendReminder', payload).subscribe(
  //       (res: any) => {
  //         this.toggleSpinner(false);
  //         if (res.status === true) {
  //           this.toastService.success(res.message);
  //           this.selectedEmpIds = [];
  
  //           // Force change detection (only if needed)
  //           setTimeout(() => {
  //             this.selectedEmpIds = [...this.selectedEmpIds]; 
  //           }, 0);
  //         } else {
  //           this.toastService.error(res.message);
  //         }
  //       },
  //       (error) => {
  //         console.error("Error sending reminder:", error);
  //       }
  //     );
  //   } else {
  //     alert("Please select at least one employee.");
  //   }
  // }

    messageSave() {
  const message = this.formData.get('message')?.value?.trim();
  if (!message) return;

  const isGroup = !!this.taskDetail?.group; // You can adjust based on actual group flag
  const replyBlock = document.querySelector('.replyCard');

  // let reply_to_id = null;
  let replayName = '';
  let replaymsg = '';

  if (this.isreplyMessage && replyBlock?.classList.contains('show')) {
    replayName = (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .conversation-name") as HTMLElement)?.innerText || '';
    replaymsg = (document.querySelector(".replyCard .replymessage-block .flex-grow-1 .mb-0") as HTMLElement)?.innerText || '';
    // reply_to_id = this.replyMessageId || null; // Set this when reply is triggered
  }

  const payload = {
    task_id: this.id,
    chat_id:this.taskDetail?.group.chatId,
    sender_type: 'admin',
    sender_id: this.company_id,
    receiver_type: this.receiverId ?'employee'  :null ,
    receiver_id: this.receiverId  ?this.receiverId : null ,
    is_group: isGroup,
    message: message,
    message_type: 'text',
    reply_to_id: this.messageId
  };


    this.api.post('sendTaskmessage', payload).subscribe({
    next: (res) => {

      this.getTaskDetail()
    

      this.scrollToBottom();
      this.resetForm();
    },
    error: (err) => {
      console.error('Message send failed', err);
    }
  });
}

resetForm() {
  this.formData.reset();
  this.isreplyMessage = false;
  this.emoji = '';
  this.receiverId = '';
  this.messageId = null;
  // this.replyMessageId = null;

  const replyCard = document.querySelector('.replyCard');
  if (replyCard) {
    replyCard.classList.remove('show');
    (replyCard.querySelector('.conversation-name') as HTMLElement).innerText = '';
    (replyCard.querySelector('.mb-0') as HTMLElement).innerText = '';
  }
}

scrollToBottom() {
  setTimeout(() => {
    const chatList = document.getElementById("users-conversation");
    if (chatList) {
      chatList.scrollTop = chatList.scrollHeight;
    }
  }, 100);
}

}




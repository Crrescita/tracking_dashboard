import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, UntypedFormGroup } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { SocketService } from '../../core/services/socket.service';
@Component({
  selector: 'app-assigned-task',
  templateUrl: './assigned-task.component.html',
  styleUrl: './assigned-task.component.scss'
})
export class AssignedTaskComponent {
  formGroup!: FormGroup;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  task_id:any;
  emp_id:any;
  taskData:any;
  employeeDetail:any;
  empTask:any;
  commentText: string = ""; 

   isStatus = 'online';
  selectedEmployee: any = null;

  isreplyMessage = false;
  formData!: UntypedFormGroup;
  company_id: any;
  messages: any[] = []; 

  task_no:any;

  currentTab = 'chats';
  constructor(private formBuilder: FormBuilder, private api: ApiService, public toastService: ToastrService,    private route: ActivatedRoute , private location: Location , private router: Router, private socketService: SocketService){

  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      status: ["",[Validators.required]],
    });
    this.route.params.subscribe((params) => {
      this.task_id = params["task_id"] ? params["task_id"] : null;
      this.emp_id = params["emp_id"] ? Number(params["emp_id"]) : null;
      this.task_no = params["task_no"] ? params["task_no"] : null;
    });
  
    if (this.task_id) {
      this.getAssignedTask();

        this.socketService.joinTaskRoom(this.task_no);
// console.log(this.id)
   this.socketService.onNewTaskMessage().subscribe((message) => {
  console.log('📨 Received new message:', message);
  this.messages.push(message);
  try {
    this.getAssignedTask();
  } catch (err) {
    console.error('❌ Error calling getTaskDetail:', err);
  }
});
    //      this.socketService.joinTaskRoom(this.task_no);
    //      console.log(this.task_no)
    //   this.socketService.onNewTaskMessage().subscribe((message) => {
    //     // console.log('📨 Received new message:', message);
    //     this.messages.push(message);
    //     this.getAssignedTask()

    //     // console.log(this.messages)
    // });
    }
    
    if (this.emp_id) {
      this.getemployeeData();
    }

      this.formData = this.formBuilder.group({
            message: ['', [Validators.required]],
        });


   
  }

  empTaskStatus(id:any) {
    this.toggleSpinner(true);
    const url = `empTaskStatus?task_id=${id}&emp_id=${this.emp_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.empTask = res.data[0] || [];
        } else {
          this.empTask = [];
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

  getAssignedTask() {
    this.toggleSpinner(true);
    const url = `empAssignTask?task_id=${this.task_id}`;
    this.api.getwithoutcache(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.taskData = res.data[0] || [];
          this.empTaskStatus(this.taskData.id);
        } else {
          this.taskData = [];
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

  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employeesDetails", this.emp_id).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.employeeDetail = res.data[0];
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  get f() {
    return this.formGroup.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  onSubmit() {
    // if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
     
        this.add(formData);
    // } else {
    //   this.formGroup.markAllAsTouched();
    // }
  }

  // createFormData() {
  //   const formData = {
  //     task_id:this.taskData?.id,
  //     status:"In-Progress",
  //     emp_ids:this.emp_id
  //   };
  //   return formData;
  // }
  createFormData() {
    return {
      task_id: this.taskData?.id,
      status: this.empTask?.status === "In-Progress" ? "Completed" : "In-Progress",
      emp_ids: this.emp_id
    };
  }

  submitComment() {
    if (!this.commentText.trim()) return;

    const commentData = {
      task_id: this.taskData?.id,
      emp_ids: this.emp_id,
      comment: {
        text: this.commentText,     
        timestamp: new Date().toISOString()
      },
      status: "In-Progress"
    };

    this.add(commentData);
this.commentText = ""
    // this.taskService.addComment(commentData).subscribe((response) => {
    //   if (response.status) {
    //     this.commentText = ""; // Clear input after submitting
    //   }
    // });
  }

  add(formData: any) {
    this.api.post("updateTaskStatus", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.formGroup.reset();
      this.toastService.success(res.message);
      this.getAssignedTask()
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }


  confirm() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(3, 142, 220)',
      cancelButtonColor: 'rgb(243, 78, 78)',
      confirmButtonText: 'Yes, Completed!',
      cancelButtonText: 'No, cancel!',
    }).then(result => {
      if (result.value) {
       this.onSubmit()
        // Swal.fire({ title: 'Deleted!', text: 'Your file has been deleted.', confirmButtonColor: 'rgb(3, 142, 220)', icon: 'success', });
      } else if (
        // Read more about handling dismissals
        result.dismiss === Swal.DismissReason.cancel
      ) {
        // Swal.fire({
        //   title: 'Cancelled',
        //   text: 'Your imaginary file is safe :)',
        //   icon: 'error',
        //   confirmButtonColor: 'rgb(3, 142, 220)',
        //   showCancelButton: true,
        // })
      }
    });
  }

   changeTab(tab: string) {
        this.currentTab = tab;
          const userChatShow = document.querySelector('.user-chat');
        if (userChatShow != null) {
            userChatShow.classList.add('user-chat-show');
        }

    }



    // chat

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


     messageSave() {
  const message = this.formData.get('message')?.value?.trim();
  if (!message) return;

  const isGroup = !!this.taskData?.group; // You can adjust based on actual group flag
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
    task_id: this.taskData?.id,
    chat_id:this.taskData?.group.chatId,
    sender_type: 'employee',
    sender_id: this.emp_id,
    receiver_type: this.receiverId ?'admin'  :null ,
    receiver_id: this.receiverId  ?this.receiverId : null ,
    is_group: isGroup,
    message: message,
    message_type: 'text',
    reply_to_id: this.messageId
  };


    this.api.post('sendTaskmessage', payload).subscribe({
    next: (res) => {

      this.getAssignedTask()
    

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

getInitials(name: string | undefined): string {
  if (!name) return '';
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
}

goBack(): void {
  this.router.navigate([`/pages/task-list/${this.emp_id}`]);
}

}

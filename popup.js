window.onload = function () {
  var toggle = document.getElementById("isenabled");
  var scroll_toggle = document.getElementById("autoscroll_toggle");
  var interaction_filter = document.getElementById("interaction_filter");
  var comment_filter = document.getElementById("comment_filter");
  var share_filter = document.getElementById("share_filter");
  var view_filter = document.getElementById("view_filter");

  chrome.storage.sync.get("isenabled", function (enabled_status) {
    if (enabled_status.isenabled == 1) {
      chrome.browserAction.setIcon({ path: "green_icon.png" });
      document.getElementById("isenabled").checked = true;
      document.getElementById("autoscroll_toggle_div").style.display = "block";
    } else {
      chrome.browserAction.setIcon({ path: "red_icon.png" });
      document.getElementById("isenabled").checked = false;
      chrome.storage.sync.set({ autoscroll_status: 0 });
      document.getElementById("autoscroll_toggle_div").style.display = "none";
    }
  });

  chrome.storage.sync.get("autoscroll_status", function (autoscroll) {
    if (autoscroll.autoscroll_status == 1) {
      document.getElementById("autoscroll_toggle").checked = true;
    } else {
      document.getElementById("autoscroll_toggle").checked = false;
    }
  });

  // Interaction
  chrome.storage.sync.get("interaction_filter", function (
    interaction_filter_status
  ) {
    if (interaction_filter_status.interaction_filter) {
      document.getElementById("interaction_filter").value =
        interaction_filter_status.interaction_filter;
    } else {
      document.getElementById("interaction_filter").value = 0;
    }
  });

  // Share
  chrome.storage.sync.get("share_filter", function (share_filter_status) {
    if (share_filter_status.share_filter) {
      document.getElementById("share_filter").value =
        share_filter_status.share_filter;
    } else {
      document.getElementById("share_filter").value = 0;
    }
  });

  // Comment
  chrome.storage.sync.get("comment_filter", function (comment_filter_status) {
    if (comment_filter_status.comment_filter) {
      document.getElementById("comment_filter").value =
        comment_filter_status.comment_filter;
    } else {
      document.getElementById("comment_filter").value = 0;
    }
  });

  // View
  chrome.storage.sync.get("view_filter", function (view_filter_status) {
    if (view_filter_status.view_filter) {
      document.getElementById("view_filter").value =
        view_filter_status.view_filter;
    } else {
      document.getElementById("view_filter").value = 0;
    }
  });

  // Toggle

  toggle.addEventListener("change", (event) => {
    if (toggle.checked) {
      chrome.browserAction.setIcon({ path: "green_icon.png" });
      chrome.storage.sync.set({ isenabled: 1 });
      document.getElementById("autoscroll_toggle_div").style.display = "block";
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { isEnabled: "true" }, function () {
          // do nothing
        });
      });
    } else {
      chrome.browserAction.setIcon({ path: "red_icon.png" });
      chrome.storage.sync.set({ isenabled: 0 });
      chrome.storage.sync.set({ autoscroll_status: 0 });
      document.getElementById("autoscroll_toggle").checked = false;
      document.getElementById("autoscroll_toggle_div").style.display = "none";
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { isEnabled: "false" },
          function () {
            // do nothing
          }
        );
      });
    }
  });

  // Autoscroll
  autoscroll_toggle.addEventListener("change", (event) => {
    if (autoscroll_toggle.checked) {
      chrome.storage.sync.set({ autoscroll_status: 1 });
    } else {
      chrome.storage.sync.set({ autoscroll_status: 0 });
    }
  });

  // Interaction filter
  interaction_filter.addEventListener("change", (event) => {
    chrome.storage.sync.set({ interaction_filter: interaction_filter.value });
  });

  // Share filter
  share_filter.addEventListener("change", (event) => {
    chrome.storage.sync.set({ share_filter: share_filter.value });
  });

  // Comment filter
  comment_filter.addEventListener("change", (event) => {
    chrome.storage.sync.set({ comment_filter: comment_filter.value });
  });

  // View filter
  view_filter.addEventListener("change", (event) => {
    chrome.storage.sync.set({ view_filter: view_filter.value });
  });
};

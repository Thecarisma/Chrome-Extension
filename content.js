let interactionCount = 0;
let commentCount = 0;
let shareCount = 0;
let mylatitude = null;
let mylongitude = null;
let dataArray = [];

(function () {
  ("use strict");

  const successCallback = (position) => {
    if (position.coords.latitude) {
      mylatitude = position.coords.latitude;
    }

    if (position.coords.longitude) {
      mylongitude = position.coords.longitude;
    }
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);
  };

  const errorCallback = (error) => {
    mylongitude = null;
    mylongitude = null;
    console.log(error);
  };

  navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

  const whitelist = [];
  const blacklist = [
    "._m8c",
    ".uiStreamSponsoredLink",
    'a[data-hovercard][href*="hc_ref=ADS"]',
    'a[role="button"][rel~="noopener"][data-lynx-mode="async"]',
  ];

  const sponsoredTexts = [
    "Sponsored",
    "مُموَّل", // Arabic
    "赞助内容", // Chinese (Simplified)
    "贊助", // Chinese (Traditional)
    "Sponzorováno", // Czech
    "Gesponsord", // Dutch
    "May Sponsor", // Filipino
    "Sponsorisé", // French
    "Gesponsert", // German
    "Χορηγούμενη", // Greek
    "ממומן", // Hebrew
    "प्रायोजित", // Hindi
    "Bersponsor", // Indonesian
    "Sponsorizzato", // Italian
    "Sponsorowane", // Polish
    "Patrocinado", // Portuguese (Brazil)
    "Реклама", // Russian
    "Sponzorované", // Slovak
    "Publicidad", // Spanish
    "ได้รับการสนับสนุน", // Thai
    "Sponsorlu", // Turkish
    "Được tài trợ", // Vietnamese
  ];
  const possibleSponsoredTextQueries = [
    'div[id^="feedsubtitle"] > :first-child',
    'div[id^="feed_sub_title"] > :first-child',
    'div[id^="feed__sub__title"] > :first-child',
    'div[id^="feedlabel"] > :first-child',
    'div[id^="fbfeed_sub_header_id"] > :nth-child(3)',
    'div[data-testid$="storysub-title"] > :first-child',
    'div[data-testid$="story-subtilte"] > :first-child',
    'div[data-testid$="story--subtilte"] > :first-child',
    'a[role="button"][aria-labelledby]',
    'a[role="link"] > span[aria-labelledby]', // FB5 design
    'div[role="button"] > span[aria-labelledby]', // FB5 design
    "a[role=link][href*='/ads/about']", // new FB5 design
    'div[data-testid*="subtitle"] > :first-child',
    'div[data-testid*="label"] > :first-child',
  ];

  function isHidden(e) {
    const style = window.getComputedStyle(e);

    if (
      style.display === "none" ||
      style.opacity === "0" ||
      style.fontSize === "0px" ||
      style.visibility === "hidden" ||
      style.position === "absolute"
    ) {
      return true;
    }

    return false;
  }

  function getTextFromElement(e) {
    return (e.innerText === "" ? e.dataset.content : e.innerText) || "";
  }

  function getTextFromContainerElement(e) {
    return (
      e.dataset.content ||
      Array.prototype.filter
        .call(e.childNodes, (element) => {
          return element.nodeType === Node.TEXT_NODE;
        })
        .map((element) => {
          return element.textContent;
        })
        .join("")
    );
  }

  function getVisibleText(e) {
    if (isHidden(e)) {
      return "";
    }

    const children = e.querySelectorAll(":scope > *");

    if (children.length !== 0) {
      return (
        getTextFromContainerElement(e) +
        Array.prototype.slice.call(children).map(getVisibleText).flat().join("")
      );
    }

    return getTextFromElement(e);
  }

  function hideIfSponsored(e) {
    chrome.storage.sync.get("interaction_filter", function (
      interaction_filter_status
    ) {
      if (interaction_filter_status.interaction_filter > 0) {
        interactionCount = parseInt(
          interaction_filter_status.interaction_filter
        );
      } else {
        interactionCount = 0;
      }
    });

    chrome.storage.sync.get("comment_filter", function (comment_filter_status) {
      if (comment_filter_status.comment_filter > 0) {
        commentCount = parseInt(comment_filter_status.comment_filter);
      } else {
        commentCount = 0;
      }
    });

    chrome.storage.sync.get("share_filter", function (share_filter_status) {
      if (share_filter_status.share_filter > 0) {
        shareCount = parseInt(share_filter_status.share_filter);
      } else {
        shareCount = 0;
      }
    });

    e.dataset.blocked = "non-sponsored";
    return possibleSponsoredTextQueries.some((query) => {
      const result = e.querySelectorAll(query);
      return [...result].some((t) => {
        const visibleText = getVisibleText(t);

        if (
          sponsoredTexts.some(
            (sponsoredText) => visibleText.indexOf(sponsoredText) !== -1
          )
        ) {
          let likesOfOne,
            commentsOfOne,
            sharesOfOne,
            actualLikesOfOne,
            actualCommentsOfOne,
            actualSharesOfOne,
            mediaUrl = {};
          let descriptionArray = [];
          let linksArray = [];
          let headingCandidatesArray = [];

          e.dataset.blocked = "sponsored";
          console.info(
            `AD Shown (query='${query}', visibleText='${visibleText}')`,
            [e]
          );
          console.log("HIDE IS SPONCERED");
          // e.style.display = "none";

          console.log(e);
          let allSpans = e.getElementsByTagName("span");
          let allVideos = e.getElementsByTagName("video");
          let allImages = e.getElementsByTagName("img");
          let allAnchors = e.getElementsByTagName("a");
          let allStrong = e.getElementsByTagName("strong");

          let allSpansArray = Array.from(allSpans);
          let allVideosArray = Array.from(allVideos);
          let allImagesArray = Array.from(allImages);
          let allAnchorsArray = Array.from(allAnchors);
          let allStrongArray = Array.from(allStrong);

          allStrongArray.forEach((tag) => {
            if (!headingCandidatesArray.includes(tag.innerText)) {
              headingCandidatesArray = [
                ...headingCandidatesArray,
                tag.innerText,
              ];
            }
          });

          allAnchorsArray.forEach((anchor) => {
            if (!linksArray.includes(anchor.getAttribute("href"))) {
              linksArray = [...linksArray, anchor.getAttribute("href")];
            }
          });

          allSpansArray.forEach((span) => {
            // console.log(span.innerText, span.getAttribute("class"));

            if (span.getAttribute("class")) {
              if (
                span.getAttribute("class").split(" ").includes("a3bd9o3v") &&
                span.innerText.length > 60
              ) {
                if (!descriptionArray.includes(span.innerText)) {
                  descriptionArray = [...descriptionArray, span.innerText];
                }
              } else if (span.innerText.length >= 80) {
                descriptionArray = [...descriptionArray, span.innerText];
              }
            }
          });

          if (allVideosArray.length > 0) {
            console.log(
              allVideosArray[0].getElementsByTagName("source")[0].src
            );

            mediaUrl = {
              type: "VIDEO",
              url: allVideosArray[0].getElementsByTagName("source")[0].src,
            };
          } else {
            mediaUrl = {
              type: "IMAGE",
              url: allImagesArray[0].getAttribute("src"),
            };
          }

          let requiredInfoSpan = allSpansArray.slice(
            allSpansArray.length - 30,
            allSpansArray.length
          );

          for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
            if (
              parseFloat(requiredInfoSpan[index].innerText) !== NaN &&
              parseFloat(requiredInfoSpan[index].innerText) ===
                parseFloat(requiredInfoSpan[index + 1].innerText) &&
              requiredInfoSpan[index].innerText.length < 10
            ) {
              likesOfOne = parseFloat(requiredInfoSpan[index].innerText);

              if (!likesOfOne || likesOfOne === NaN) {
                likesOfOne = 0;
              }

              if (
                requiredInfoSpan[index].innerText.includes("k") ||
                requiredInfoSpan[index].innerText.includes("K")
              ) {
                actualLikesOfOne =
                  parseFloat(requiredInfoSpan[index].innerText) * 1000;
              } else if (
                requiredInfoSpan[index].innerText.includes("M") ||
                requiredInfoSpan[index].innerText.includes("m")
              ) {
                actualLikesOfOne =
                  parseFloat(requiredInfoSpan[index].innerText) * 1000000;
              } else {
                actualLikesOfOne = likesOfOne;
              }

              break;
            }
          }

          for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
            if (
              (requiredInfoSpan[index].innerText.includes("comment") ||
                requiredInfoSpan[index].innerText.includes("Comment")) &&
              parseFloat(requiredInfoSpan[index].innerText) !== NaN
            ) {
              commentsOfOne = parseFloat(requiredInfoSpan[index].innerText);

              if (!commentsOfOne || commentsOfOne === NaN) {
                commentsOfOne = 0;
              }

              if (
                requiredInfoSpan[index].innerText.split(" ")[0].includes("k") ||
                requiredInfoSpan[index].innerText.split(" ")[0].includes("K")
              ) {
                actualCommentsOfOne = commentsOfOne * 1000;
              } else if (
                requiredInfoSpan[index].innerText.split(" ")[0].includes("m") ||
                requiredInfoSpan[index].innerText.split(" ")[0].includes("M")
              ) {
                console.log("second else if");
                actualCommentsOfOne = commentsOfOne * 1000000;
              } else {
                actualCommentsOfOne = commentsOfOne;
              }

              break;
            }
          }

          for (let index = 0; index < requiredInfoSpan.length - 1; index++) {
            if (
              (requiredInfoSpan[index].innerText.includes("share") ||
                requiredInfoSpan[index].innerText.includes("Share")) &&
              parseFloat(requiredInfoSpan[index].innerText) !== NaN
            ) {
              sharesOfOne = parseFloat(requiredInfoSpan[index].innerText);

              if (!sharesOfOne || sharesOfOne === NaN) {
                sharesOfOne = 0;
              }

              if (
                requiredInfoSpan[index].innerText.split(" ")[0].includes("k") ||
                requiredInfoSpan[index].innerText.split(" ")[0].includes("K")
              ) {
                actualSharesOfOne = sharesOfOne * 1000;
              } else if (
                requiredInfoSpan[index].innerText.split(" ")[0].includes("m") ||
                requiredInfoSpan[index].innerText.split(" ")[0].includes("M")
              ) {
                actualSharesOfOne = sharesOfOne * 1000000;
              } else {
                actualSharesOfOne = sharesOfOne;
              }

              break;
            }
          }

          if (!actualLikesOfOne) {
            actualLikesOfOne = 0;
          }

          if (!actualCommentsOfOne) {
            actualCommentsOfOne = 0;
          }

          if (!actualSharesOfOne) {
            actualSharesOfOne = 0;
          }

          if (
            actualLikesOfOne < interactionCount ||
            actualCommentsOfOne < commentCount ||
            actualSharesOfOne < shareCount
          ) {
            e.style.display = "none";
          }

          dataArray = [
            ...dataArray,
            {
              likes: actualLikesOfOne,
              comments: actualCommentsOfOne,
              shares: actualSharesOfOne,
              headingCandidatesArray,
              descriptionArray,
              linksArray,
              mediaUrl,
              location: {
                lat: mylatitude,
                long: mylongitude,
              },
            },
          ];

          console.log(dataArray);

          return true;
        } else {
          if (is_enabled) {
            e.dataset.blocked = "non-sponsored";
            e.innerHTML = "";
          } else {
            e.dataset.blocked = "non-sponsored";
          }
        }
        return false;
      });
    });
  }

  let feedObserver = null; // wait for and observe FB5 feed element

  function setFB5FeedObserver() {
    // We are expecting to find a new feed div
    const feed = document.querySelector("div[role=feed]");

    if (feed !== null) {
      // check existing posts
      feed
        .querySelectorAll('div[data-pagelet^="FeedUnit_"]')
        .forEach(hideIfSponsored);
      const feedContainer = feed.parentNode; // flag this feed as monitored

      feed.dataset.adblockMonitored = true;
      feedObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // check if feed was reloaded without changing page
          if (
            mutation.target === feedContainer &&
            mutation.addedNodes.length > 0
          ) {
            feedObserver.disconnect(); // check again for the new feed. Since the DOM has just changed, we
            // want to wait a bit and start looking for the new div after it was
            // rendered. We put our method at the end of the current queue stack

            setTimeout(setFB5FeedObserver, 0);
          } // new feed posts added

          if (mutation.target === feed && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (
                node.dataset.pagelet &&
                node.dataset.pagelet.startsWith("FeedUnit_")
              ) {
                hideIfSponsored(node);
              }
            });
          }
        });
      }); // check for new feed posts

      feedObserver.observe(feed, {
        childList: true,
      }); // check if the feed is replaced

      feedObserver.observe(feedContainer, {
        childList: true,
      });
      console.info("Monitoring feed updates", [feed]);
    } else {
      // no feed div was available yet in DOM. will check again
      setTimeout(setFB5FeedObserver, 1000);
    }
  }

  function onPageChange() {
    let feed = document.getElementById("stream_pagelet");

    if (feed !== null) {
      // if the user change page to homepage
      feed
        .querySelectorAll('div[id^="hyperfeed_story_id_"]')
        .forEach(hideIfSponsored);
      feedObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.id.startsWith("hyperfeed_story_id_")) {
            hideIfSponsored(mutation.target);
          }
        });
      });
      feedObserver.observe(feed, {
        childList: true,
        subtree: true,
      });
      console.info("Monitoring feed updates", [feed]);
      return;
    }

    feed = document.getElementById("pagelet_group_");

    if (feed !== null) {
      // if the user change page to https://www.facebook.com/groups/*
      feed.querySelectorAll('div[id^="mall_post_"]').forEach(hideIfSponsored);
      feedObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.target
            .querySelectorAll('div[id^="mall_post_"]')
            .forEach(hideIfSponsored);
        });
      });
      feedObserver.observe(feed, {
        childList: true,
        subtree: true,
      });
      console.info("Monitoring feed updates", [feed]);
      return;
    } // FB5 design
    // there's a feed div that we don't monitor yet

    feed = document.querySelector("div[role=feed]");

    if (feed !== null) {
      setFB5FeedObserver();
      return;
    } // there's a feed loading placeholder

    feed = document.getElementById("suspended-feed");

    if (feed !== null) {
      setFB5FeedObserver();
      return;
    } // No new feed was detected
    // Cleanup observer when there's no feed monitored left in DOM

    if (
      feedObserver !== null &&
      document.querySelector("div[role=feed]") === null
    ) {
      feedObserver.disconnect();
    }
  }

  const fbObserver = new MutationObserver(onPageChange); // wait for and observe FB5 page element

  function setupFB5PageObserver() {
    // We are expecting to find a page div
    const pageDiv = document.querySelector(
      "div[data-pagelet=root] div[data-pagelet=page]"
    ); // make sure there's a page element

    if (pageDiv !== null) {
      // trigger first page initiation
      onPageChange(); // Facebook uses ajax to load new content so
      // we need to observe the container of the page
      // for any page changes

      fbObserver.observe(pageDiv.parentNode, {
        childList: true,
      });
      console.info("Monitoring page changes", [pageDiv]);
    } else {
      // no page div was available yet in DOM. will check again
      setTimeout(setupFB5PageObserver, 1000);
    }
  }

  let fbContent = document.getElementsByClassName("fb_content")[0];

  if (fbContent !== undefined) {
    // Old Facebook design
    // remove on first load
    onPageChange(); // Facebook uses ajax to load new content so
    // we need this to watch for page change

    fbObserver.observe(fbContent, {
      childList: true,
    });
    console.info("Monitoring page changes", [fbContent]);
  } else if (document.getElementById("mount_0_0") !== null) {
    // if it's FB5 design
    setupFB5PageObserver();
  } // if we can't find ".fb_content", then it must be a mobile website.
  // in that case, we don't need javascript to block ads
  // cleanup

  window.addEventListener("beforeunload", () => {
    fbObserver.disconnect();

    if (feedObserver !== null) {
      feedObserver.disconnect();
    }

    fbContent = null;
  });
})();

// Format interaction/view/share/comment count
function number_formatter(input) {
  var divider = 1;
  input = input.replace("&nbsp;", "");
  if (input.includes(" ")) input = input.substring(0, input.indexOf(" "));

  if (input.includes(",")) divider = 10;

  if (input.includes(".")) divider = 10;

  input = input.replace(",", "").replace(".", "");

  if (input.includes("K")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("k")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("B")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("b")) return (parseInt(input, 10) * 1000) / divider;
  if (input.includes("M")) return (parseInt(input, 10) * 1000000) / divider;
  if (input.includes("m")) return (parseInt(input, 10) * 1000000) / divider;

  return parseInt(input, 10) / divider;
}
// Scroll down the page
var is_scrolling = 0;

function pageScroll() {
  chrome.storage.sync.get("autoscroll_status", function (autoscroll) {
    if (autoscroll.autoscroll_status == 1) {
      window.scrollBy(0, 2);
      is_scrolling = 1;
    } else is_scrolling = 0;
  });

  scrolldelay = setTimeout(pageScroll, 10);
}

// Record saved ads & don't post them to web service multiple times
var checked_ads = [];

var version_code = 4;
var interaction_limit = 0;
var comment_limit = 0;
var share_limit = 0;
var view_limit = 0;
var interaction_count = 0;
var comment_count = 0;
var share_count = 0;
var view_count = 0;
var text_content = "";
var advertiser = "";
var post_link = "";
var post_id = "";
var advertiser_link = "-";
var type = "IMAGE";
var post_date = "";
var parser = new DOMParser();
var doc;
var interaction_count_s = "0";
var comment_count_s = "0";
var view_count_s = "0";
var share_count_s = "0";
var post_title = "";
var posts;
var is_enabled = false;
var advertiser_image = "";
var post_image = "";
var post_video = "";
var tmp = "";
var ip_address = "";
var country = "";
var is_location_checked = false;
var destination_url = "";
var temp_var = "";
var urlParts = "";

pageScroll();

// Select the node that will be observed for mutations
var targetNode = document.getElementsByTagName("body")[0];

// Options for the observer (which mutations to observe)
var config = {
  attributes: true,
  childList: true,
  subtree: true,
};
function isElement(element) {
  return element instanceof Element || element instanceof HTMLDocument;
}

function isHidden(e) {
  if (!isElement(e)) {
    return true;
  }
  const style = window.getComputedStyle(e);

  if (
    style.display === "none" ||
    style.opacity === "0" ||
    style.fontSize === "0px" ||
    style.visibility === "hidden" ||
    style.position === "absolute"
  ) {
    return true;
  }
  return false;
}

function handleAdPosts() {
  if (
    loadInteractionSetting &&
    loadCommentSetting &&
    loadSharedSetting &&
    loadViewLimitSetting
  ) {
    document.querySelectorAll("*[data-blocked=sponsored]").forEach((x) => {
      extractAd(x);
    });
  }
  document.querySelectorAll("*[data-blocked=non-sponsored]").forEach((x) => {
    if (is_enabled) {
      x.innerHTML = "";
    }
  });
}

function extractAd(postEl) {}

// Callback function to execute when mutations are observed
var callback = function (mutationsList, observer) {
  // Check if Extension enabled
  setUpSettings();

  handleAdPosts();
};
var loadInteractionSetting = false;
var loadCommentSetting = false;
var loadSharedSetting = false;
var loadViewLimitSetting = false;
function setUpSettings() {
  chrome.storage.sync.get("isenabled", function (enabled_status) {
    if (enabled_status.isenabled == 1) {
      if (!is_enabled) {
        window.scrollTo({ top: 100, behavior: "smooth" });
      }
      is_enabled = true;
      // Check interaction count filter
      chrome.storage.sync.get("interaction_filter", function (
        interaction_filter_status
      ) {
        if (interaction_filter_status.interaction_filter > 0) {
          interaction_limit = parseInt(
            interaction_filter_status.interaction_filter
          );
        } else {
          interaction_limit = 0;
        }
        loadInteractionSetting = true;
      });

      // Check comment count filter
      chrome.storage.sync.get("comment_filter", function (
        comment_filter_status
      ) {
        if (comment_filter_status.comment_filter > 0) {
          comment_limit = parseInt(comment_filter_status.comment_filter);
        } else {
          comment_limit = 0;
        }
        loadCommentSetting = true;
      });

      // Check share count filter
      chrome.storage.sync.get("share_filter", function (share_filter_status) {
        if (share_filter_status.share_filter > 0) {
          share_limit = parseInt(share_filter_status.share_filter);
        } else {
          share_limit = 0;
        }
        loadSharedSetting = true;
      });

      // Check view count filter
      chrome.storage.sync.get("view_filter", function (view_filter_status) {
        if (view_filter_status.view_filter > 0) {
          view_limit = parseInt(view_filter_status.view_filter);
        } else {
          view_limit = 0;
        }
        loadViewLimitSetting = true;
      });
    } else {
      is_enabled = false;
    }
  });
}

// Create an observer instance linked to the callback function
var observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

chrome.runtime.onMessage.addListener((msgObj) => {
  // do something with msgObj
  if (msgObj.isEnabled == "true") {
    if (!is_enabled) {
      window.scrollTo({ top: 100, behavior: "smooth" });
    }
    is_enabled = true;
  } else if (msgObj.isEnabled == "false") {
    is_enabled = false;
  }
});

function sendData() {
  console.log("Sending data to database");

  if (dataArray.length > 0) {
    fetch("https://adhunt-backend.herokuapp.com/api/v1/advertisement/array", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        array: dataArray,
      }),
    })
      .then((res) => {
        console.log("Response is");
        console.log(res);
      })
      .catch((err) => {
        console.log("ERROR IS");
        console.log(err);
      });

    dataArray = [];
  }
}

setInterval(() => {
  sendData();
}, 30000);

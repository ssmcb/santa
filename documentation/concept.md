So the logic is:\
  - a user needs to create a secret santa group, so he goes to the site and
  clicks get started\
  - he adds an e-mail and is forwarded to a verification screen, receives a
  code in his e-mail, verifies the e-mail in the verification screen\
  - he can now create a group and add the participants to this group (some
  metadata should be also available like date and place of the event). The
  group has an invitation link that he can either send through e-mail or
  through whatsapp with https://wa.me/<cellphone number in the format
  country code plus number>\
  - each participant has to click on the link, which takes them to a screen
  where they see the name of the group and an input to enter an email. They
  enter their e-mail, gets forwarded to a verification screen and verify
  with the code they received in their e-mail. In the verification page, the
  e-mail entered should be visible and they can also fix the e-mail and/or
  resend the code after 30 seconds\
  - the owner of the group should be able to see which participants have
  signed up and which are still pending. Once the owner is satisfied with
  the participants subscribed, he should be able to start the lottery, which
  will randomly assign each participant another participant that is not
  himself. Each participant should receive their secret santa in their
  e-mail and also be able to see the name of their secret santa in their
  dashboard of the group. The owner should be able to see that all e-mails
  have been sent and that participants received e-mails (we can set up an
  SNS queue for this).
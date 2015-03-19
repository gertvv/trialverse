package org.drugis.trialverse.graph.controller;

import org.apache.http.HttpResponse;
import org.apache.http.ProtocolVersion;
import org.apache.http.message.BasicHttpResponse;
import org.apache.http.message.BasicStatusLine;
import org.apache.jena.riot.RDFLanguages;
import org.drugis.trialverse.dataset.repository.DatasetReadRepository;
import org.drugis.trialverse.security.Account;
import org.drugis.trialverse.graph.repository.GraphReadRepository;
import org.drugis.trialverse.graph.repository.GraphWriteRepository;
import org.drugis.trialverse.testutils.TestUtils;
import org.drugis.trialverse.util.Namespaces;
import org.drugis.trialverse.util.service.TrialverseIOUtilsService;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Matchers;
import org.mockito.Mock;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import javax.inject.Inject;
import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.net.URI;
import java.security.Principal;

import static org.mockito.Mockito.*;
import static org.mockito.MockitoAnnotations.initMocks;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Configuration
@EnableWebMvc
public class GraphControllerTest {

  private MockMvc mockMvc;

  @Inject
  private WebApplicationContext webApplicationContext;

  @Mock
  private GraphWriteRepository graphWriteRepository;

  @Mock
  private GraphReadRepository graphReadRepository;

  @Mock
  private DatasetReadRepository datasetReadRepository;

  @Mock
  private TrialverseIOUtilsService trialverseIOUtilsService;

  @InjectMocks
  private GraphController graphController;

  private Account john = new Account(1, "john@apple.co.uk", "John", "Lennon");
  private Principal user;

  @Before
  public void setUp() throws Exception {
    graphReadRepository = mock(GraphReadRepository.class);
    graphWriteRepository = mock(GraphWriteRepository.class);
    datasetReadRepository = mock(DatasetReadRepository.class);
    graphController = new GraphController();

    initMocks(this);
    mockMvc = MockMvcBuilders.standaloneSetup(graphController).build();
    user = mock(Principal.class);
    when(user.getName()).thenReturn(john.getUsername());
  }

  @After
  public void tearDown() throws Exception {
    verifyNoMoreInteractions(graphWriteRepository);
  }

  @Test
  public void testGetGraph() throws Exception {
    String datasetUUID = "datasetUUID";
    String studyUUID = "studyUUID";
    BasicStatusLine statusLine = new BasicStatusLine(new ProtocolVersion("mock protocol", 1, 0), HttpStatus.OK.value(), "some good reason");
    HttpResponse httpResponse = new BasicHttpResponse(statusLine);
    URI trialverseDatasetUri = new URI(Namespaces.DATASET_NAMESPACE + datasetUUID);
    when(graphReadRepository.getStudy(trialverseDatasetUri, studyUUID)).thenReturn(httpResponse);


    mockMvc.perform(get("/datasets/" + datasetUUID + "/graphs/" + studyUUID).principal(user))
            .andExpect(status().isOk())
            .andExpect(content().contentType(RDFLanguages.TURTLE.getContentType().getContentType()));

    verify(graphReadRepository).getStudy(trialverseDatasetUri, studyUUID);
    verify(trialverseIOUtilsService).writeResponseContentToServletResponse(any(HttpResponse.class), any(HttpServletResponse.class));
  }

  @Test
  public void testCreateGraphUserIsNotDatasetOwner() throws Exception {
    String jsonContent = TestUtils.loadResource(this.getClass(), "/mockStudy.json");
    String datasetUUID = "datasetUUID";
    URI datasetUri = new URI(Namespaces.DATASET_NAMESPACE + datasetUUID);
    String studyUUID = "studyUUID";
    when(datasetReadRepository.isOwner(datasetUri, user)).thenReturn(false);

    mockMvc.perform(
            put("/datasets/" + datasetUUID + "/graphs/" + studyUUID)
                    .content(jsonContent)
                    .principal(user)).andExpect(status().isForbidden());

    verify(datasetReadRepository).isOwner(datasetUri, user);
    verifyZeroInteractions(graphWriteRepository);
  }

  @Test
  public void testUpdateStudy() throws Exception {
    String updateContent = "updateContent";
    String datasetUUID = "datasetUUID";
    URI datasetUrl = new URI(Namespaces.DATASET_NAMESPACE + datasetUUID);
    String studyUUID = "studyUUID";

    when(datasetReadRepository.isOwner(datasetUrl, user)).thenReturn(true);

    mockMvc.perform(
            put("/datasets/" + datasetUUID + "/graphs/" + studyUUID)
                    .content(updateContent)
                    .principal(user))
            .andExpect(status().isOk());

    verify(datasetReadRepository).isOwner(datasetUrl, user);
    verify(graphWriteRepository).updateStudy(Matchers.<URI>anyObject(), anyString(), Matchers.any(InputStream.class));
  }

  @Test
  public void testUpdateStudyUserNotDatasetOwner() throws Exception {
    String jsonContent = TestUtils.loadResource(this.getClass(), "/mockStudy.json");
    String datasetUUID = "datasetUUID";
    URI datasetUrl = new URI(Namespaces.DATASET_NAMESPACE + datasetUUID);
    String studyUUID = "studyUUID";
    when(datasetReadRepository.isOwner(datasetUrl, user)).thenReturn(false);

    mockMvc.perform(
            put("/datasets/" + datasetUUID + "/graphs/" + studyUUID)
                    .content(jsonContent)
                    .principal(user)).andExpect(status().isForbidden());

    verify(datasetReadRepository).isOwner(datasetUrl, user);
  }
}